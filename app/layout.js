import { Pacifico, Fredoka } from "next/font/google";
import "./globals.css";

const pacifico = Pacifico({
  weight: "400",
  variable: "--font-pacifico",
  subsets: ["latin"],
});

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
});

export const metadata = {
  title: "Will You Be My Valentine?",
  description: "A very important question...",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${pacifico.variable} ${fredoka.variable}`}>
        {children}
      </body>
    </html>
  );
}
