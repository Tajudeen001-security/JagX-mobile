import React, { useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import Constants from "expo-constants";

type Msg = { role: "user" | "assistant"; content: string };

const API_URL: string =
  (Constants.expoConfig?.extra?.JAGX_API_URL as string) ||
  "https://YOUR-VERCEL-APP.vercel.app/api/chat";

const MODELS = [
  { id: "jagx-v1", label: "JagX v1" },
  { id: "jagx-pro", label: "JagX Pro" },
];

export default function App() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [model, setModel] = useState("jagx-v1");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<FlatList<Msg>>(null);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setBusy(true);

    try {
      // React Native's fetch doesn't support streaming reads the same way
      // browsers do, so mobile does a single non-streamed request and
      // renders the full reply when it arrives. (Simpler + reliable on RN.)
      const res = await fetch(API_URL.replace("stream=true", ""), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, model }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: `⚠️ ${err.error || "Error"}` };
          return copy;
        });
        return;
      }

      // Server streams SSE; on mobile we just read the whole body and
      // parse out the text deltas rather than incrementally rendering.
      const raw = await res.text();
      let acc = "";
      for (const line of raw.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const data = trimmed.slice(5).trim();
        if (data === "[DONE]" || !data) continue;
        try {
          const json = JSON.parse(data);
          acc += json.choices?.[0]?.delta?.content ?? "";
        } catch {
          // ignore
        }
      }

      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "assistant", content: acc || "(no response)" };
        return copy;
      });
    } catch {
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "assistant", content: "⚠️ Connection error." };
        return copy;
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>⚡ JagX</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {MODELS.map((m) => (
            <TouchableOpacity
              key={m.id}
              onPress={() => setModel(m.id)}
              style={[styles.pill, model === m.id && styles.pillActive]}
            >
              <Text style={[styles.pillText, model === m.id && styles.pillTextActive]}>
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={{ padding: 12, gap: 10 }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.role === "user" ? styles.bubbleUser : styles.bubbleBot]}>
            <Text style={item.role === "user" ? styles.bubbleTextUser : styles.bubbleTextBot}>
              {item.content}
            </Text>
          </View>
        )}
      />

      {busy && <ActivityIndicator style={{ marginBottom: 6 }} />}

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask JagX to build something…"
            multiline
          />
          <TouchableOpacity style={styles.sendBtn} onPress={send} disabled={busy}>
            <Text style={{ color: "#fff", fontWeight: "600" }}>{busy ? "…" : "Send"}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: { fontSize: 20, fontWeight: "700" },
  pill: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: "#ccc" },
  pillActive: { backgroundColor: "#111", borderColor: "#111" },
  pillText: { fontSize: 12, color: "#111" },
  pillTextActive: { color: "#fff" },
  bubble: { padding: 12, borderRadius: 12, maxWidth: "85%" },
  bubbleUser: { alignSelf: "flex-end", backgroundColor: "#111" },
  bubbleBot: { alignSelf: "flex-start", backgroundColor: "#f2f2f2" },
  bubbleTextUser: { color: "#fff", fontSize: 14 },
  bubbleTextBot: { color: "#111", fontSize: 14 },
  inputRow: { flexDirection: "row", padding: 12, gap: 8, borderTopWidth: 1, borderTopColor: "#eee" },
  input: { flex: 1, borderWidth: 1, borderColor: "#ccc", borderRadius: 10, padding: 10, maxHeight: 100 },
  sendBtn: { backgroundColor: "#111", borderRadius: 10, paddingHorizontal: 18, justifyContent: "center" },
});
