import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import dayjs from "dayjs";

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#262626",
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
    paddingBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 9,
    color: "#737373",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  table: {
    display: "table",
    width: "auto",
    marginTop: 10,
  },
  tableRow: {
    margin: "auto",
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
    paddingVertical: 8,
  },
  tableHeader: {
    backgroundColor: "#FAFAFA",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
    fontWeight: "bold",
    color: "#737373",
    textTransform: "uppercase",
    fontSize: 7,
  },
  tableCol: {
    paddingHorizontal: 5,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 50,
    right: 50,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    paddingTop: 10,
    textAlign: "center",
    fontSize: 7,
    color: "#A3A3A3",
  },
});

const TableHeader = ({ columns }) => (
  <View style={[styles.tableRow, styles.tableHeader]}>
    {columns.map((col, i) => (
      <View key={i} style={[styles.tableCol, { width: col.width }]}>
        <Text>{col.label}</Text>
      </View>
    ))}
  </View>
);

const TableRow = ({ data, columns }) => (
  <View style={styles.tableRow}>
    {columns.map((col, i) => (
      <View key={i} style={[styles.tableCol, { width: col.width }]}>
        <Text>{col.render ? col.render(data) : data[col.key] || "—"}</Text>
      </View>
    ))}
  </View>
);

const UserReport = ({ data }) => {
  const columns = [
    { label: "Full Name", key: "fullName", width: "25%" },
    { label: "Email", key: "email", width: "35%" },
    { label: "Role", key: "role", width: "15%" },
    { label: "Status", key: "status", width: "15%" },
    { label: "Joined", width: "10%", render: (d) => dayjs(d.createdAt).format("MMM DD, YY") },
  ];

  return (
    <View style={styles.table}>
      <TableHeader columns={columns} />
      {data.map((item, i) => <TableRow key={i} data={item} columns={columns} />)}
    </View>
  );
};

const FinanceReport = ({ data }) => {
  const columns = [
    { label: "ID", width: "20%", render: (d) => String(d._id).slice(-8).toUpperCase() },
    { label: "Amount", width: "15%", render: (d) => `$${d.amount?.toLocaleString()}` },
    { label: "Fee", width: "10%", render: (d) => `$${d.platformFee?.toLocaleString() || 0}` },
    { label: "Status", key: "status", width: "15%" },
    { label: "Type", key: "paymentType", width: "20%" },
    { label: "Date", width: "20%", render: (d) => dayjs(d.createdAt).format("MMM DD, YYYY") },
  ];

  return (
    <View style={styles.table}>
      <TableHeader columns={columns} />
      {data.map((item, i) => <TableRow key={i} data={item} columns={columns} />)}
    </View>
  );
};

const PlatformReport = ({ data }) => {
  const columns = [
    { label: "Task Title", key: "title", width: "40%" },
    { label: "Category", key: "category", width: "20%" },
    { label: "Budget", width: "15%", render: (d) => `$${d.budget?.toLocaleString()}` },
    { label: "Status", key: "status", width: "15%" },
    { label: "Created", width: "10%", render: (d) => dayjs(d.createdAt).format("MMM DD, YY") },
  ];

  return (
    <View style={styles.table}>
      <TableHeader columns={columns} />
      {data.map((item, i) => <TableRow key={i} data={item} columns={columns} />)}
    </View>
  );
};

const AdminReportsPDF = ({ type, data }) => {
  const title = `${type} Directory Report`;
  const date = dayjs().format("MMMM DD, YYYY");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>Vendorlink Platform Audit | Generated on {date}</Text>
        </View>

        {type === "User" && <UserReport data={data} />}
        {type === "Finance" && <FinanceReport data={data} />}
        {type === "Platform" && <PlatformReport data={data} />}

        <Text style={styles.footer}>
          Confidential Administrative Report - Vendorlink Inc.
        </Text>
      </Page>
    </Document>
  );
};

export default AdminReportsPDF;
