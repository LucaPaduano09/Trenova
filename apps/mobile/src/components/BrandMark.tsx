import { StyleSheet, Text, View } from "react-native";

type BrandMarkProps = {
  size?: "sm" | "md" | "lg";
};

export function BrandMark({ size = "md" }: BrandMarkProps) {
  const tone = sizeMap[size];

  return (
    <View
      style={[
        styles.shell,
        {
          width: tone.outer,
          height: tone.outer,
          borderRadius: tone.radius,
        },
      ]}
    >
      <View
        style={[
          styles.innerRing,
          {
            width: tone.inner,
            height: tone.inner,
            borderRadius: tone.innerRadius,
          },
        ]}
      />
      <Text style={[styles.letter, { fontSize: tone.fontSize }]}>T</Text>
    </View>
  );
}

const sizeMap = {
  sm: {
    outer: 44,
    inner: 26,
    radius: 16,
    innerRadius: 10,
    fontSize: 20,
  },
  md: {
    outer: 56,
    inner: 32,
    radius: 20,
    innerRadius: 12,
    fontSize: 26,
  },
  lg: {
    outer: 72,
    inner: 40,
    radius: 26,
    innerRadius: 14,
    fontSize: 32,
  },
} as const;

const styles = StyleSheet.create({
  shell: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    shadowColor: "#020617",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 8,
  },
  innerRing: {
    position: "absolute",
    backgroundColor: "#0F172A",
    opacity: 0.92,
  },
  letter: {
    color: "#F8FAFC",
    fontWeight: "900",
    letterSpacing: 0.4,
  },
});
