import ThemeWrapper from "@/components/ThemeWrapper";  // ← NEW
import "./globals.css";

export const metadata = {
  title: "AI Email Agent",
  description: "Smart email management system",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>
        <ThemeWrapper>
          {children}
        </ThemeWrapper>
      </body>
    </html>
  );
}