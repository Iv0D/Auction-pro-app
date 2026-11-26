import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type AlertType = "success" | "error" | "warning";

interface Props {
  visible: boolean;
  title: string;
  message: string;
  type: AlertType;
  onClose: () => void;
}

export default function CustomAlert({
  visible,
  title,
  message,
  type,
  onClose,
}: Props) {
  const config = {
    success: {
      icon: "check-circle",
      color: "#FFD600",
      bg: "#2D2D2D",
    },
    error: {
      icon: "alert-circle",
      color: "#FF6B6B",
      bg: "#2D2D2D",
    },
    warning: {
      icon: "alert",
      color: "#FFA726",
      bg: "#2D2D2D",
    },
  };

  const current = config[type];

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: `${current.color}20` },
            ]}
          >
            <MaterialCommunityIcons
              name={current.icon as any}
              size={40}
              color={current.color}
            />
          </View>

          <Text style={styles.title}>{title}</Text>

          <Text style={styles.message}>
            {message}
          </Text>

          <Pressable
            style={styles.button}
            onPress={onClose}
          >
            <Text style={styles.buttonText}>
              ACEPTAR
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  container: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#232323",
    borderRadius: 30,
    padding: 30,
    alignItems: "center",
  },

  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 25,
  },

  title: {
    color: "white",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 15,
  },

  message: {
    color: "#BDBDBD",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 30,
  },

  button: {
    width: "100%",
    backgroundColor: "#FFD600",
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
  },

  buttonText: {
    color: "#111",
    fontWeight: "700",
    letterSpacing: 1,
  },
});