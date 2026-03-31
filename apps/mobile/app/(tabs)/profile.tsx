import { Pressable, StyleSheet, Text } from "react-native";
import { AppScreen } from "@/src/components/AppScreen";
import { SurfaceCard } from "@/src/components/SurfaceCard";
import { useAuth } from "@/src/providers/AuthProvider";

export default function ProfileScreen() {
  const { me, signOut } = useAuth();

  return (
    <AppScreen
      title="Profilo"
      subtitle="Dati cliente e collegamento trainer, con la stessa logica protetta già usata nel web."
    >
      <SurfaceCard>
        <Text style={styles.name}>{me?.client.fullName ?? "Cliente Trenova"}</Text>
        <Text style={styles.row}>{me?.client.email ?? "Email non disponibile"}</Text>
        <Text style={styles.row}>{me?.client.phone ?? "Telefono non disponibile"}</Text>
        <Text style={styles.workspace}>
          {me?.workspace?.name ?? "Nessun workspace collegato"}
        </Text>
        <Pressable style={styles.secondaryButton} onPress={() => void signOut()}>
          <Text style={styles.secondaryButtonText}>Esci</Text>
        </Pressable>
      </SurfaceCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  name: {
    color: "#F8FAFC",
    fontSize: 24,
    fontWeight: "800",
  },
  row: {
    marginTop: 10,
    color: "#CBD5E1",
    fontSize: 15,
  },
  workspace: {
    marginTop: 18,
    color: "#7DD3FC",
    fontSize: 14,
    fontWeight: "700",
  },
  secondaryButton: {
    marginTop: 22,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingVertical: 14,
  },
  secondaryButtonText: {
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "700",
  },
});
