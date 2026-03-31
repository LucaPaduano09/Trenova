import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type LaunchScreenProps = {
  subtitle?: string;
};

export function LaunchScreen({
  subtitle = "Stiamo preparando il tuo spazio cliente.",
}: LaunchScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>T</Text>
        </View>
        <Text style={styles.title}>Trenova</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <ActivityIndicator
          size="small"
          color="#34D399"
          style={styles.loader}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0B1324",
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  badge: {
    height: 84,
    width: 84,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111A2E",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    shadowColor: "#020617",
    shadowOpacity: 0.28,
    shadowRadius: 24,
    shadowOffset: {
      width: 0,
      height: 14,
    },
    elevation: 8,
  },
  badgeText: {
    color: "#F8FAFC",
    fontSize: 34,
    fontWeight: "800",
  },
  title: {
    marginTop: 24,
    color: "#F8FAFC",
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  subtitle: {
    marginTop: 12,
    color: "#CBD5E1",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  loader: {
    marginTop: 28,
  },
});
