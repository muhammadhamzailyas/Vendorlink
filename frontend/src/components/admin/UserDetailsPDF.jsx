import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import dayjs from "dayjs";
import { formatCategory } from "../../lib/status";

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#262626",
  },
  header: {
    marginBottom: 30,
    borderBottom: "1pt solid #E5E5E5",
    paddingBottom: 20,
    textAlign: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 8,
    color: "#737373",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 8,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#737373",
    marginBottom: 12,
    borderBottom: "0.5pt solid #F5F5F5",
    paddingBottom: 4,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -10,
  },
  col: {
    width: "50%",
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  label: {
    fontSize: 7,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: "#A3A3A3",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 10,
    color: "#262626",
  },
  descriptionBox: {
    marginTop: 10,
    padding: 12,
    backgroundColor: "#FAFAFA",
    borderRadius: 4,
  },
  descriptionText: {
    fontSize: 9,
    lineHeight: 1.5,
    color: "#404040",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 50,
    right: 50,
    borderTop: "0.5pt solid #E5E5E5",
    paddingTop: 10,
    textAlign: "center",
    fontSize: 7,
    color: "#A3A3A3",
  },
});

const DataItem = ({ label, value }) => (
  <View style={styles.col}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value || "—"}</Text>
  </View>
);

const UserDetailsPDF = ({ user }) => {
  const isCompany = user.role === "company";
  const profile = isCompany ? user.companyProfile : user.vendorProfile;
  const isAdmin = user.role === "admin";
  const displayName = isAdmin ? "Admin" : (user.companyName || user.fullName || user.email || "User Profile");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{displayName}</Text>
          <Text style={styles.subtitle}>User Profile Report | {user.role} | {user.status}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={styles.grid}>
            <DataItem label="Full Name" value={user.fullName} />
            <DataItem label="Email Address" value={user.email} />
            <DataItem label="Phone Number" value={user.phone} />
            <DataItem label="Member Since" value={dayjs(user.createdAt).format("MMM DD, YYYY")} />
            <DataItem label="Status" value={user.status} />
          </View>
        </View>

        {!isAdmin && profile && (
          <View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{isCompany ? "Company Details" : "Vendor Details"}</Text>
              <View style={styles.grid}>
                {isCompany ? (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: '100%' }}>
                    <DataItem label="Company Name" value={profile.companyName} />
                    <DataItem label="Industry" value={profile.industry} />
                    <DataItem label="Registration No." value={profile.registrationNumber} />
                    <DataItem label="Tax ID / NTN" value={profile.ntn} />
                    <DataItem label="Company Size" value={profile.companySize} />
                    <DataItem label="Year Established" value={profile.yearEstablished} />
                    <DataItem label="Website" value={profile.website} />
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: '100%' }}>
                    <DataItem label="Vendor Type" value={profile.vendorType} />
                    <DataItem label="Category" value={formatCategory(profile.category)} />
                    <DataItem label="Experience" value={profile.yearsOfExperience ? `${profile.yearsOfExperience} Years` : null} />
                    <DataItem label="National ID / CNIC" value={profile.cnicNumber} />
                    <DataItem label="Skills" value={Array.isArray(profile.skills) ? profile.skills.join(", ") : profile.skills} />
                    <DataItem label="Portfolio URL" value={profile.portfolioURL} />
                  </View>
                )}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Address Information</Text>
              <View style={styles.grid}>
                <DataItem label="Street Address" value={profile.streetAddress} />
                <DataItem label="City" value={profile.city} />
                <DataItem label="Province / State" value={profile.province} />
                <DataItem label="Postal / Zip Code" value={profile.zipCode} />
                <DataItem label="Country" value={profile.country} />
              </View>
            </View>

            {(profile.description || profile.bio) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{isCompany ? "Description" : "Professional Bio"}</Text>
                <View style={styles.descriptionBox}>
                  <Text style={styles.descriptionText}>{profile.description || profile.bio}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        <Text style={styles.footer}>
          Generated by Vendorlink Admin Panel on {dayjs().format("MMM DD, YYYY HH:mm")}
        </Text>
      </Page>
    </Document>
  );
};

export default UserDetailsPDF;
