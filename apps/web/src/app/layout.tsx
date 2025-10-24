import './globals.css';

export const metadata = {
  title: 'Zerafile',
  description: 'Zerafile - File hosting and URI metadata service',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground">{children}</body>
    </html>
  );
}
