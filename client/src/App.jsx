// import React, { useState } from "react";
// import "./App.css";
// import jsPDF from "jspdf";
// import { saveAs } from "file-saver";
// import {
//   Document,
//   Packer,
//   Paragraph,
//   TextRun,
// } from "docx";

// function App() {
//   const [step, setStep] = useState("register"); // register | verify | login | chat
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [otp, setOtp] = useState("");
//   const [token, setToken] = useState("");

//   const [messages, setMessages] = useState([]);
//   const [input, setInput] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const [msg, setMsg] = useState("");
//   const [shareLink, setShareLink] = useState("");
//   const [pdfFile, setPdfFile] = useState(null);
//   const [pdfQuestion, setPdfQuestion] = useState("");
//   const [pdfAnswer, setPdfAnswer] = useState("");

//   const handleUploadPDF = async () => {
//     if (!pdfFile) {
//       alert("Please select a PDF file first");
//       return;
//     }
//     const formData = new FormData();
//     formData.append("file", pdfFile);

//     try {
//       const res = await fetch("http://localhost:5000/api/upload-pdf", {
//         method: "POST",
//         body: formData,
//       });
//       const data = await res.json();
//       if (data.message) {
//         alert("✅ PDF uploaded successfully");
//       } else {
//         alert(data.error || "Upload failed");
//       }
//     } catch (err) {
//       alert("Error uploading PDF");
//     }
//   };
//   const handleAskPDF = async () => {
//     if (!pdfQuestion.trim()) return;

//     try {
//       const res = await fetch("http://localhost:5000/api/ask", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ question: pdfQuestion }),
//       });
//       const data = await res.json();
//       if (data.answer) {
//         setPdfAnswer(data.answer);
//       } else {
//         setPdfAnswer("⚠️ Failed to get answer.");
//       }
//     } catch (err) {
//       setPdfAnswer("⚠️ Error contacting server.");
//     }
//   };

//   const handleShare = async () => {
//     try {
//       const res = await fetch("http://localhost:5000/api/save-chat", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ messages }),
//       });
//       const data = await res.json();
//       if (data.link) {
//         setShareLink(data.link);
//       } else {
//         alert("Failed to create share link");
//       }
//     } catch {
//       alert("Error sharing chat");
//     }
//   };

//   // ---------------- AUTH ----------------
//   const handleRegister = async () => {
//     try {
//       const res = await fetch("http://localhost:5000/api/register", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ email, password }),
//       });
//       const data = await res.json();
//       if (data.message) {
//         setMsg("✅ OTP sent to email");
//         setStep("verify");
//       } else {
//         setMsg(data.error || "Registration failed");
//       }
//     } catch (err) {
//       setMsg("Error registering user");
//     }
//   };

//   const handleVerify = async () => {
//     try {
//       const res = await fetch("http://localhost:5000/api/verify-otp", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ email, otp }),
//       });
//       const data = await res.json();
//       if (data.message) {
//         setMsg("Email verified, now login");
//         setStep("login");
//       } else {
//         setMsg(data.error || "Verification failed");
//       }
//     } catch (err) {
//       setMsg("Error verifying OTP");
//     }
//   };

//   const handleLogin = async () => {
//     try {
//       const res = await fetch("http://localhost:5000/api/login", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ email, password }),
//       });
//       const data = await res.json();
//       if (data.token) {
//         setToken(data.token);
//         localStorage.setItem("token", data.token);
//         setMsg("✅ Logged in successfully");
//         setStep("chat");
//       } else {
//         setMsg(data.error || "Login failed");
//       }
//     } catch (err) {
//       setMsg("Error logging in");
//     }
//   };

//   // ---------------- CHAT ----------------
//   const handleSend = async () => {
//     if (!input.trim()) return;

//     const userMessage = { text: input, sender: "user" };
//     setMessages((prev) => [...prev, userMessage]);
//     setInput("");
//     setIsLoading(true);

//     try {
//       const response = await fetch("http://localhost:5000/api/chat", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`, // send JWT
//         },
//         body: JSON.stringify({ message: input }),
//       });

//       const data = await response.json();

//       if (data.reply) {
//         setMessages((prev) => [...prev, { text: data.reply, sender: "bot" }]);
//       } else {
//         throw new Error("No reply from server");
//       }
//     } catch (error) {
//       console.error("Error:", error);
//       setMessages((prev) => [
//         ...prev,
//         { text: "⚠️ Sorry, I encountered an error. Please try again.", sender: "bot" },
//       ]);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // ---------------- EXPORT FUNCTIONS ----------------
//   const exportToPDF = () => {
//     const doc = new jsPDF();
//     doc.setFont("helvetica", "normal");
//     doc.setFontSize(14);
//     doc.text("📄 Chat Export", 10, 10);

//     let y = 20;
//     messages.forEach((msg) => {
//       const sender = msg.sender === "user" ? "You" : "Bot";
//       doc.setFont("helvetica", "bold");
//       doc.text(`${sender}:`, 10, y);
//       doc.setFont("helvetica", "normal");
//       doc.text(msg.text, 30, y);
//       y += 10;
//     });

//     doc.save("chat.pdf");
//   };

//   const exportToDoc = async () => {
//     const doc = new Document({
//       sections: [
//         {
//           children: [
//             new Paragraph({
//               children: [
//                 new TextRun({
//                   text: "📄 Chat Export",
//                   bold: true,
//                   size: 28,
//                   color: "2E86C1",
//                 }),
//               ],
//               spacing: { after: 300 },
//             }),
//             ...messages.map(
//               (msg) =>
//                 new Paragraph({
//                   children: [
//                     new TextRun({
//                       text: msg.sender === "user" ? "You: " : "Bot: ",
//                       bold: true,
//                       color: msg.sender === "user" ? "1976d2" : "d32f2f",
//                     }),
//                     new TextRun(msg.text),
//                   ],
//                   spacing: { after: 200 },
//                 })
//             ),
//           ],
//         },
//       ],
//     });

//     const blob = await Packer.toBlob(doc);
//     saveAs(blob, "chat.docx");
//   };

//   const exportToHTML = () => {
//     let html = `
//       <html>
//       <head>
//         <title>Chat Export</title>
//         <style>
//           body { font-family: Arial, sans-serif; padding: 20px; }
//           .user { color: #1976d2; font-weight: bold; }
//           .bot { color: #d32f2f; font-weight: bold; }
//           .msg { margin: 5px 0; }
//         </style>
//       </head>
//       <body>
//         <h2>📄 Chat Export</h2>
//     `;
//     messages.forEach((msg) => {
//       const sender = msg.sender === "user" ? "You" : "Bot";
//       const senderClass = msg.sender === "user" ? "user" : "bot";
//       html += `<p class="msg"><span class="${senderClass}">${sender}:</span> ${msg.text}</p>`;
//     });
//     html += "</body></html>";

//     const blob = new Blob([html], { type: "text/html;charset=utf-8" });
//     saveAs(blob, "chat.html");
//   };

//   // ---------------- RENDER ----------------
//   return (
//     <div className="App">
//       <header className="App-header">
//         <h1>📑 DocuDraft Pro Assistant</h1>
//       </header>

//       {step !== "chat" && (
//         <div style={{ margin: "20px" }}>
//           <p>{msg}</p>

//           {step === "register" && (
//             <div>
//               <h2>Register</h2>
//               <input
//                 type="email"
//                 placeholder="Email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//               /><br />
//               <input
//                 type="password"
//                 placeholder="Password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//               /><br />
//               <button onClick={handleRegister}>Register</button>
//             </div>
//           )}

//           {step === "verify" && (
//             <div>
//               <h2>Verify OTP</h2>
//               <input
//                 type="text"
//                 placeholder="Enter OTP"
//                 value={otp}
//                 onChange={(e) => setOtp(e.target.value)}
//               /><br />
//               <button onClick={handleVerify}>Verify</button>
//             </div>
//           )}

//           {step === "login" && (
//             <div>
//               <h2>Login</h2>
//               <input
//                 type="email"
//                 placeholder="Email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//               /><br />
//               <input
//                 type="password"
//                 placeholder="Password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//               /><br />
//               <button onClick={handleLogin}>Login</button>
//             </div>
//           )}
//         </div>
//       )}

//       {step === "chat" && (
//         <div className="chat-container">
//           <div className="messages">
//             {messages.map((msg, index) => (
//               <div key={index} className={`message ${msg.sender}`}>
//                 <b>{msg.sender === "user" ? "You" : "Bot"}:</b> {msg.text}
//               </div>
//             ))}

//             {isLoading && <div className="message bot">💭 Thinking...</div>}
//           </div>

//           <div className="input-area">
//             <input
//               type="text"
//               value={input}
//               onChange={(e) => setInput(e.target.value)}
//               onKeyPress={(e) => e.key === "Enter" && handleSend()}
//               placeholder="Ask about document drafting..."
//               disabled={isLoading}
//             />
//             <button onClick={handleSend} disabled={isLoading}>
//               Send
//             </button>
//           </div>

//           {/* Export buttons */}
//           <div>
//             <button onClick={exportToPDF}>📄 Export PDF</button>
//             <button onClick={exportToDoc}>📝 Export DOCX</button>
//             <button onClick={exportToHTML}>🌐 Export HTML</button>
//             <button onClick={handleShare}>🔗 Share Link</button>
//           </div>

//           {shareLink && (
//             <p>
//               ✅ Share this link: <a href={shareLink} target="_blank" rel="noreferrer">{shareLink}</a>
//             </p>
//           )}

//         </div>
//       )}
//     </div>
//   );
// }

// export default App;
import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import { saveAs } from "file-saver";
import { Document, Packer, Paragraph, TextRun } from "docx";
import "./App.css";

function App() {
  const [step, setStep] = useState("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [token, setToken] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [shareLink, setShareLink] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfQuestion, setPdfQuestion] = useState("");
  const [pdfAnswer, setPdfAnswer] = useState("");
  const [activeTab, setActiveTab] = useState("chat");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
      setStep("chat");
    }
  }, []);

  const handleUploadPDF = async () => {
    if (!pdfFile) {
      alert("Please select a PDF file first");
      return;
    }
    const formData = new FormData();
    formData.append("file", pdfFile);

    try {
      const res = await fetch("http://localhost:5000/api/upload-pdf", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.message) {
        alert("✅ PDF uploaded successfully");
      } else {
        alert(data.error || "Upload failed");
      }
    } catch (err) {
      alert("Error uploading PDF");
    }
  };

  const handleAskPDF = async () => {
    if (!pdfQuestion.trim()) return;

    try {
      const res = await fetch("http://localhost:5000/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: pdfQuestion }),
      });
      const data = await res.json();
      if (data.answer) {
        setPdfAnswer(data.answer);
      } else {
        setPdfAnswer("⚠️ Failed to get answer.");
      }
    } catch (err) {
      setPdfAnswer("⚠️ Error contacting server.");
    }
  };

  const handleShare = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/save-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });
      const data = await res.json();
      if (data.link) {
        setShareLink(data.link);
      } else {
        alert("Failed to create share link");
      }
    } catch {
      alert("Error sharing chat");
    }
  };

  // ---------------- AUTH ----------------
  const handleRegister = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.message) {
        setMsg("✅ OTP sent to email");
        setStep("verify");
      } else {
        setMsg(data.error || "Registration failed");
      }
    } catch (err) {
      setMsg("Error registering user");
    }
  };

  const handleVerify = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (data.message) {
        setMsg("Email verified, now login");
        setStep("login");
      } else {
        setMsg(data.error || "Verification failed");
      }
    } catch (err) {
      setMsg("Error verifying OTP");
    }
  };

  const handleLogin = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.token) {
        setToken(data.token);
        localStorage.setItem("token", data.token);
        setMsg("✅ Logged in successfully");
        setStep("chat");
      } else {
        setMsg(data.error || "Login failed");
      }
    } catch (err) {
      setMsg("Error logging in");
    }
  };

  const handleLogout = () => {
    setToken("");
    localStorage.removeItem("token");
    setStep("login");
    setMessages([]);
  };

  // ---------------- CHAT ----------------
  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { text: input, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();

      if (data.reply) {
        setMessages((prev) => [...prev, { text: data.reply, sender: "bot" }]);
      } else {
        throw new Error("No reply from server");
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        { text: "⚠️ Sorry, I encountered an error. Please try again.", sender: "bot" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------- EXPORT FUNCTIONS ----------------
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    doc.text("📄 Chat Export", 10, 10);

    let y = 20;
    messages.forEach((msg) => {
      const sender = msg.sender === "user" ? "You" : "Bot";
      doc.setFont("helvetica", "bold");
      doc.text(`${sender}:`, 10, y);
      doc.setFont("helvetica", "normal");
      const splitText = doc.splitTextToSize(msg.text, 180);
      doc.text(splitText, 30, y);
      y += splitText.length * 7;
    });

    doc.save("chat.pdf");
  };

  const exportToDoc = async () => {
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "📄 Chat Export",
                  bold: true,
                  size: 28,
                  color: "2E86C1",
                }),
              ],
              spacing: { after: 300 },
            }),
            ...messages.map(
              (msg) =>
                new Paragraph({
                  children: [
                    new TextRun({
                      text: msg.sender === "user" ? "You: " : "Bot: ",
                      bold: true,
                      color: msg.sender === "user" ? "1976d2" : "d32f2f",
                    }),
                    new TextRun(msg.text),
                  ],
                  spacing: { after: 200 },
                })
            ),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, "chat.docx");
  };

  const exportToHTML = () => {
    let html = `
      <html>
      <head>
        <title>Chat Export</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .user { color: #1976d2; font-weight: bold; }
          .bot { color: #d32f2f; font-weight: bold; }
          .msg { margin: 10px 0; padding: 8px 12px; border-radius: 8px; }
          .user-msg { background-color: #e3f2fd; margin-left: 20px; }
          .bot-msg { background-color: #ffebee; margin-right: 20px; }
          h2 { color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>📄 Chat Export</h2>
    `;
    messages.forEach((msg) => {
      const sender = msg.sender === "user" ? "You" : "Bot";
      const senderClass = msg.sender === "user" ? "user" : "bot";
      const msgClass = msg.sender === "user" ? "user-msg" : "bot-msg";
      html += `<p class="msg ${msgClass}"><span class="${senderClass}">${sender}:</span> ${msg.text}</p>`;
    });
    html += "</div></body></html>";

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    saveAs(blob, "chat.html");
  };

  // ---------------- RENDER ----------------
  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo-container">
            <h1>📑 DocuDraft Pro Assistant</h1>
          </div>
          {step === "chat" && (
            <div className="header-actions">
              <button className="icon-button" onClick={() => setSidebarOpen(!sidebarOpen)}>
                ☰
              </button>
              <button className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="main-content">
        {step !== "chat" ? (
          <div className="auth-container">
            <div className="auth-card">
              <h2 className="auth-title">
                {step === "register" && "Create Account"}
                {step === "verify" && "Verify Email"}
                {step === "login" && "Login"}
              </h2>
              
              {msg && <div className={`auth-message ${msg.includes("✅") ? "success" : "error"}`}>{msg}</div>}
              
              {step === "register" && (
                <div className="auth-form">
                  <div className="input-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label>Password</label>
                    <input
                      type="password"
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <button className="auth-button" onClick={handleRegister}>
                    Register
                  </button>
                  <p className="auth-link">
                    Already have an account? <span onClick={() => setStep("login")}>Login here</span>
                  </p>
                </div>
              )}

              {step === "verify" && (
                <div className="auth-form">
                  <div className="input-group">
                    <label>Verification Code</label>
                    <input
                      type="text"
                      placeholder="Enter OTP sent to your email"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                    />
                  </div>
                  <button className="auth-button" onClick={handleVerify}>
                    Verify Account
                  </button>
                </div>
              )}

              {step === "login" && (
                <div className="auth-form">
                  <div className="input-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label>Password</label>
                    <input
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <button className="auth-button" onClick={handleLogin}>
                    Login
                  </button>
                  <p className="auth-link">
                    Don't have an account? <span onClick={() => setStep("register")}>Register here</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="chat-app-container">
            {/* Sidebar */}
            <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
              <div className="sidebar-tabs">
                <button 
                  className={`tab-button ${activeTab === "chat" ? "active" : ""}`}
                  onClick={() => setActiveTab("chat")}
                >
                  💬 Chat
                </button>
                <button 
                  className={`tab-button ${activeTab === "pdf" ? "active" : ""}`}
                  onClick={() => setActiveTab("pdf")}
                >
                  📄 PDF Tools
                </button>
                <button 
                  className={`tab-button ${activeTab === "export" ? "active" : ""}`}
                  onClick={() => setActiveTab("export")}
                >
                  📤 Export
                </button>
              </div>

              <div className="sidebar-content">
                {activeTab === "pdf" && (
                  <div className="pdf-tools">
                    <h3>PDF Assistant</h3>
                    <div className="input-group">
                      <label>Upload PDF</label>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setPdfFile(e.target.files[0])}
                      />
                    </div>
                    <button className="action-button" onClick={handleUploadPDF}>
                      Upload PDF
                    </button>

                    <div className="input-group">
                      <label>Ask about your PDF</label>
                      <input
                        type="text"
                        placeholder="Ask a question about your document..."
                        value={pdfQuestion}
                        onChange={(e) => setPdfQuestion(e.target.value)}
                      />
                    </div>
                    <button className="action-button" onClick={handleAskPDF}>
                      Ask PDF
                    </button>

                    {pdfAnswer && (
                      <div className="pdf-answer">
                        <h4>Answer:</h4>
                        <p>{pdfAnswer}</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "export" && (
                  <div className="export-tools">
                    <h3>Export Options</h3>
                    <button className="export-button" onClick={exportToPDF}>
                      📄 Export to PDF
                    </button>
                    <button className="export-button" onClick={exportToDoc}>
                      📝 Export to DOCX
                    </button>
                    <button className="export-button" onClick={exportToHTML}>
                      🌐 Export to HTML
                    </button>
                    
                    <div className="share-section">
                      <h4>Share Chat</h4>
                      <button className="share-button" onClick={handleShare}>
                        🔗 Generate Share Link
                      </button>
                      {shareLink && (
                        <div className="share-link">
                          <p>Share this link:</p>
                          <a href={shareLink} target="_blank" rel="noreferrer">
                            {shareLink}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "chat" && (
                  <div className="chat-info">
                    <h3>Chat Assistant</h3>
                    <p>Ask me anything about document drafting, legal templates, or contract creation.</p>
                    <div className="suggestion-chips">
                      <div className="chip">Draft a rental agreement</div>
                      <div className="chip">Create an NDA template</div>
                      <div className="chip">Business proposal structure</div>
                      <div className="chip">Employment contract clauses</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Chat Interface */}
            <div className="chat-container">
              <div className="messages-container">
                {messages.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">💬</div>
                    <h3>Start a conversation</h3>
                    <p>Ask me anything about document drafting or upload a PDF to discuss its contents.</p>
                  </div>
                ) : (
                  messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.sender}`}>
                      <div className="message-content">
                        <div className="message-sender">
                          {msg.sender === "user" ? "You" : "Assistant"}
                        </div>
                        <div className="message-text">{msg.text}</div>
                      </div>
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="message bot">
                    <div className="message-content">
                      <div className="message-sender">Assistant</div>
                      <div className="message-text typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="chat-input-container">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Type your message about document drafting..."
                  disabled={isLoading}
                  className="chat-input"
                />
                <button 
                  onClick={handleSend} 
                  disabled={isLoading}
                  className="send-button"
                >
                  {isLoading ? "⏳" : "➤"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;