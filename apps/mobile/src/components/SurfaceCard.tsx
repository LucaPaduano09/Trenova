import { StyleSheet, View, type ViewProps } from "react-native";

export function SurfaceCard({ style, ...props }: ViewProps) {
  return <View {...props} style={[styles.card, style]} />;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(17,26,46,0.68)",
    padding: 18,
  },
});
