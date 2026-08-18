export const metadata = {
  title: "FeedbackMed MVP",
  description: "Pipeline demo: CSV -> Supabase -> processed stats",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: "2rem" }}>{children}</body>
    </html>
  );
}
