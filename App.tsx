import React, { useRef, useState } from "react";
import {
  SafeAreaView, View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, StatusBar,
} from "react-native";
import Constants from "expo-constants";

type Msg = { role: "user" | "assistant"; content: string };
const API_BASE = String(Constants.expoConfig?.extra?.JAGX_API_URL || "https://jagx-ai-v2.onrender.com").replace(/\/$/, "");

export default function App() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [busy, setBusy] = useState(false);
  const listRef = useRef<FlatList<Msg>>(null);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    if (!apiKey.trim()) {
      setShowSettings(true);
      return;
    }
    setInput("");
    const history = [...messages, { role: "user" as const, content: text }];
    setMessages([...history, { role: "assistant", content: "Thinking…" }]);
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey.trim() },
        body: JSON.stringify({
          message: text,
          history: messages.filter((m) => m.role === "user" || m.role === "assistant"),
          stream: false
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = res.status === 401 || res.status === 403
          ? "API key rejected. Open Settings and check your key."
          : (data.detail || "JagX AI could not answer. Please try again.");
        setMessages((items) => [...items.slice(0, -1), { role: "assistant", content: `⚠️ ${message}` }]);
        return;
      }
      setMessages((items) => [...items.slice(0, -1), { role: "assistant", content: data.response || "No response returned." }]);
    } catch {
      setMessages((items) => [...items.slice(0, -1), { role: "assistant", content: "⚠️ Connection failed. Check your internet and try again." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#08090B" />
      <View style={styles.header}>
        <View style={styles.brandMark}><Text style={styles.brandMarkText}>J</Text></View>
        <View style={styles.brandCopy}>
          <Text style={styles.title}>JagX AI</Text>
          <Text style={styles.subtitle}>by JagX & JRILICENSE</Text>
        </View>
        <TouchableOpacity style={styles.settingsButton} onPress={() => setShowSettings((v) => !v)}>
          <Text style={styles.settingsButtonText}>{showSettings ? "Done" : "Settings"}</Text>
        </TouchableOpacity>
      </View>

      {showSettings && (
        <View style={styles.settingsPanel}>
          <Text style={styles.settingsTitle}>Connect to JagX AI</Text>
          <Text style={styles.settingsHint}>Enter your JagX API key. It stays in this screen's memory and is not embedded in the app.</Text>
          <TextInput
            style={styles.keyInput}
            value={apiKey}
            onChangeText={setApiKey}
            placeholder="jagx-••••••••••••"
            placeholderTextColor="#777B86"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.settingsHint}>API endpoint: {API_BASE}</Text>
        </View>
      )}

      {messages.length === 0 ? (
        <View style={styles.welcome}>
          <View style={styles.heroIcon}><Text style={styles.heroJ}>J</Text><View style={styles.heroDot} /></View>
          <Text style={styles.eyebrow}>YOUR AI WORKSPACE</Text>
          <Text style={styles.welcomeTitle}>Think bigger.{ "\n" }Build with JagX.</Text>
          <Text style={styles.welcomeText}>Ask questions, explore ideas, solve problems and create something new.</Text>
          <View style={styles.suggestions}>
            {["Help me build an app", "Explain a difficult topic", "Review my code"].map((item) => (
              <TouchableOpacity key={item} style={styles.suggestion} onPress={() => setInput(item)}>
                <Text style={styles.suggestionText}>{item}</Text><Text style={styles.suggestionArrow}>↗</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => (
            <View style={[styles.messageRow, item.role === "user" ? styles.userRow : styles.assistantRow]}>
              {item.role === "assistant" && <View style={styles.avatar}><Text style={styles.avatarText}>J</Text></View>}
              <View style={[styles.bubble, item.role === "user" ? styles.bubbleUser : styles.bubbleAssistant]}>
                <Text style={[styles.bubbleText, item.role === "user" ? styles.userText : styles.assistantText]}>{item.content}</Text>
              </View>
            </View>
          )}
        />
      )}

      {busy && <View style={styles.loading}><ActivityIndicator color="#D8B45A" /><Text style={styles.loadingText}>JagX is thinking…</Text></View>}

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.composerWrap}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Message JagX AI…"
              placeholderTextColor="#777B86"
              multiline
              maxLength={12000}
              returnKeyType="default"
            />
            <TouchableOpacity style={[styles.sendBtn, (!input.trim() || busy) && styles.sendDisabled]} onPress={send} disabled={busy || !input.trim()}>
              <Text style={styles.sendText}>{busy ? "…" : "↑"}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.footer}>AI can make mistakes. Review important information.</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#08090B" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#24262C", backgroundColor: "#0D0E11" },
  brandMark: { width: 42, height: 42, borderRadius: 14, backgroundColor: "#D8B45A", alignItems: "center", justifyContent: "center" },
  brandMarkText: { fontSize: 24, fontWeight: "900", color: "#111111" },
  brandCopy: { marginLeft: 11, flex: 1 },
  title: { color: "#F7F7F8", fontSize: 17, fontWeight: "800", letterSpacing: 0.2 },
  subtitle: { color: "#9295A0", fontSize: 11, marginTop: 3 },
  settingsButton: { borderWidth: 1, borderColor: "#373941", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9 },
  settingsButtonText: { color: "#D8B45A", fontSize: 12, fontWeight: "700" },
  settingsPanel: { margin: 14, padding: 15, backgroundColor: "#14151A", borderColor: "#30323A", borderWidth: 1, borderRadius: 16 },
  settingsTitle: { color: "#F7F7F8", fontSize: 15, fontWeight: "700", marginBottom: 6 },
  settingsHint: { color: "#9295A0", fontSize: 12, lineHeight: 18, marginBottom: 10 },
  keyInput: { backgroundColor: "#090A0D", borderWidth: 1, borderColor: "#393B43", borderRadius: 12, color: "#FFFFFF", paddingHorizontal: 12, paddingVertical: 12, marginBottom: 10 },
  welcome: { flex: 1, justifyContent: "center", paddingHorizontal: 24, paddingBottom: 24 },
  heroIcon: { width: 76, height: 76, borderRadius: 25, backgroundColor: "#D8B45A", alignItems: "center", justifyContent: "center", marginBottom: 28, alignSelf: "center" },
  heroJ: { fontSize: 42, fontWeight: "900", color: "#101114" },
  heroDot: { position: "absolute", right: 10, bottom: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: "#FFFFFF" },
  eyebrow: { color: "#D8B45A", fontSize: 10, fontWeight: "800", letterSpacing: 2.4, textAlign: "center", marginBottom: 12 },
  welcomeTitle: { color: "#F7F7F8", fontSize: 34, lineHeight: 40, fontWeight: "800", textAlign: "center", letterSpacing: -0.8 },
  welcomeText: { color: "#9295A0", fontSize: 14, lineHeight: 22, textAlign: "center", marginTop: 14, marginBottom: 24, paddingHorizontal: 8 },
  suggestions: { gap: 9 },
  suggestion: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 15, paddingVertical: 14, borderWidth: 1, borderColor: "#292B32", borderRadius: 14, backgroundColor: "#111216" },
  suggestionText: { color: "#DCDDDF", fontSize: 13, fontWeight: "500" },
  suggestionArrow: { color: "#D8B45A", fontSize: 17 },
  messageList: { paddingHorizontal: 14, paddingVertical: 18, gap: 15 },
  messageRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  userRow: { justifyContent: "flex-end" },
  assistantRow: { justifyContent: "flex-start" },
  avatar: { width: 28, height: 28, borderRadius: 9, backgroundColor: "#D8B45A", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#101114", fontWeight: "900" },
  bubble: { maxWidth: "86%", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 12 },
  bubbleUser: { backgroundColor: "#D8B45A", borderBottomRightRadius: 5 },
  bubbleAssistant: { backgroundColor: "#17181D", borderWidth: 1, borderColor: "#2A2C34", borderBottomLeftRadius: 5 },
  bubbleText: { fontSize: 14, lineHeight: 21 },
  userText: { color: "#121316", fontWeight: "600" },
  assistantText: { color: "#F0F0F2" },
  loading: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingBottom: 8 },
  loadingText: { color: "#D8B45A", fontSize: 12 },
  composerWrap: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 10, borderTopWidth: 1, borderTopColor: "#24262C", backgroundColor: "#0D0E11" },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: 10, backgroundColor: "#17181D", borderWidth: 1, borderColor: "#343640", borderRadius: 18, padding: 7 },
  input: { flex: 1, color: "#F7F7F8", minHeight: 42, maxHeight: 120, paddingHorizontal: 9, paddingTop: 10, paddingBottom: 8, fontSize: 14 },
  sendBtn: { width: 42, height: 42, borderRadius: 13, backgroundColor: "#D8B45A", alignItems: "center", justifyContent: "center" },
  sendDisabled: { opacity: 0.45 },
  sendText: { color: "#111111", fontSize: 26, lineHeight: 30, fontWeight: "800" },
  footer: { color: "#686C76", textAlign: "center", fontSize: 10, marginTop: 9 }
});
