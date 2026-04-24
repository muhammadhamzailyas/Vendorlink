import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import dayjs from "dayjs";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 12,
    fontFamily: "Helvetica",
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
    color: "#262626",
    fontWeight: "bold",
    textAlign: "center",
  },
  divider: {
    borderBottom: "2px solid #262626",
    marginBottom: 20,
  },
  section: {
    marginBottom: 15,
  },
  label: {
    fontSize: 10,
    color: "#9E9E9E",
    fontWeight: "bold",
    marginBottom: 4,
  },
  value: {
    fontSize: 11,
    color: "#212121",
    marginBottom: 10,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 8,
    color: "#9E9E9E",
    fontStyle: "italic",
  },
});

const capitalize = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const UserDetailsPDF = ({ user }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>User Details Report</Text>
      <View style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.label}>Company Name:</Text>
        <Text style={styles.value}>{user.companyName || "N/A"}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Email:</Text>
        <Text style={styles.value}>{user.email || "N/A"}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Username:</Text>
        <Text style={styles.value}>{user.username || "N/A"}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Role:</Text>
        <Text style={styles.value}>{capitalize(user.role || "N/A")}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Status:</Text>
        <Text style={styles.value}>{capitalize(user.status || "N/A")}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Registration Date:</Text>
        <Text style={styles.value}>
          {dayjs(user.createdAt).format("MMM DD, YYYY HH:mm")}
        </Text>
      </View>

      {user.businessType && (
        <View style={styles.section}>
          <Text style={styles.label}>Business Type:</Text>
          <Text style={styles.value}>{user.businessType}</Text>
        </View>
      )}

      {user.vendorType && (
        <View style={styles.section}>
          <Text style={styles.label}>Vendor Type:</Text>
          <Text style={styles.value}>{user.vendorType}</Text>
        </View>
      )}

      {user.description && (
        <View style={styles.section}>
          <Text style={styles.label}>Description:</Text>
          <Text style={styles.value}>{user.description}</Text>
        </View>
      )}

      {user.document && user.document !== "no-file-uploaded" && (
        <View style={styles.section}>
          <Text style={styles.label}>Uploaded Document:</Text>
          <Text style={styles.value}>{user.document}</Text>
        </View>
      )}

      <Text style={styles.footer}>
        Generated on {dayjs().format("MMM DD, YYYY HH:mm")}
      </Text>
    </Page>
  </Document>
);

export default UserDetailsPDF;



