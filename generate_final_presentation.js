const pptxgen = require('pptxgenjs');

let pptx = new pptxgen();
pptx.author = 'CaffAIne Team';
pptx.company = 'Al-Balqa Applied University';
pptx.subject = 'Graduation Project Presentation';
pptx.title = 'CaffAIne Coffee';

// Define master layout with branding
pptx.defineSlideMaster({
  title: 'MASTER_SLIDE',
  background: { color: "F8EEE6" },
  objects: [
    { rect: { x: 0, y: 0, w: '100%', h: 0.8, fill: { color: '2c1810' } } },
    { text: { text: "CaffAIne Coffee.", options: { x: 0.5, y: 0.1, w: 3, h: 0.6, fontSize: 18, color: 'c4a484', fontFace: 'Georgia', bold: true } } },
  ]
});

// SLIDE 1: Title Slide
let s1 = pptx.addSlide();
s1.background = { color: "2c1810" };
s1.addText("CaffAIne Coffee.", { x: 0.5, y: 0.8, w: '90%', fontSize: 54, bold: true, color: "c4a484", fontFace: 'Georgia', align: 'center' });
s1.addText("Intelligent Management & E-Commerce for Specialty Coffee", { x: 0.5, y: 1.8, w: '90%', fontSize: 22, color: "FFFFFF", align: 'center' });

s1.addText("Team Members:\nOmar Al-Ajarmeh (Leader)\nSultan Al-Adawi\nMohammad Al-Hadidi\nBashar Al-Dabbas", { x: 0.5, y: 2.5, w: '45%', fontSize: 16, color: "E0E0E0", align: 'left', lineSpacing: 22 });
s1.addText("Supervisor:\nDr. Mohammad Riyalat", { x: 5.5, y: 2.5, w: '45%', fontSize: 16, color: "E0E0E0", align: 'right', lineSpacing: 22 });

s1.addText("Prince Abdullah bin Ghazi Faculty of Information Technology\nAl-Balqa Applied University - Al-Salt Center\nMay 2026", { x: 0.5, y: 4.2, w: '90%', fontSize: 14, color: "c4a484", align: 'center', lineSpacing: 20 });

// SLIDE 2: Problem Statement
let s2 = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
s2.addText("1. Problem Statement", { x: 0.5, y: 1.2, fontSize: 32, bold: true, color: "2c1810" });
s2.addText([
  { text: "Lack of Tailored Systems:", options: { bold: true, color: "c4a484" } },
  { text: " Specialty coffee shops rely on generic POS systems that don't capture the nuances of their craft.\n", options: { breakLine: true } },
  { text: "Operational Inefficiency:", options: { bold: true, color: "c4a484" } },
  { text: " Managing inventory, analyzing sales, and tracking complex custom orders manually is prone to errors.\n", options: { breakLine: true } },
  { text: "Fragmented Customer Experience:", options: { bold: true, color: "c4a484" } },
  { text: " Existing delivery apps charge high commissions and strip away the brand's premium identity.", options: { breakLine: true } }
], { x: 0.5, y: 2.0, w: '90%', fontSize: 20, color: "333333", bullet: { type: 'number' }, lineSpacing: 28 });

// SLIDE 3: Objectives
let s3 = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
s3.addText("2. Objectives", { x: 0.5, y: 1.2, fontSize: 32, bold: true, color: "2c1810" });
s3.addText([
  { text: "Develop a premium, customer-first web application that reflects the specialty coffee brand.", options: { breakLine: true } },
  { text: "Automate and centralize inventory, orders, and store status management for staff.", options: { breakLine: true } },
  { text: "Integrate an AI-powered assistant (Sophie) to provide personalized recommendations for customers and instant analytical insights for management.", options: { breakLine: true } },
  { text: "Ensure real-time responsiveness with features like web-audio alarms for new orders and low stock.", options: { breakLine: true } }
], { x: 0.5, y: 2.0, w: '90%', fontSize: 22, color: "333333", bullet: true, lineSpacing: 32 });

// SLIDE 4: Existing Solutions
let s4 = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
s4.addText("3. Existing Solutions & Limitations", { x: 0.5, y: 1.2, fontSize: 32, bold: true, color: "2c1810" });
s4.addText([
  { text: "Generic POS Systems (e.g., Square, Toast):", options: { bold: true } },
  { text: " Great for generic retail, but lack AI integrations and deep customization for specialty coffee.\n", options: { breakLine: true } },
  { text: "Third-Party Delivery Apps (e.g., Talabat, Careem):", options: { bold: true } },
  { text: " High commission fees (up to 30%), loss of direct customer relationships, and poor brand representation.\n", options: { breakLine: true } },
  { text: "The CaffAIne Innovation:", options: { bold: true, color: "c4a484" } },
  { text: " An end-to-end, zero-commission bespoke solution. Built-in analytics, complete brand control, and intelligent AI automation.", options: { breakLine: true } }
], { x: 0.5, y: 2.0, w: '90%', fontSize: 20, color: "333333", bullet: true, lineSpacing: 26 });

// SLIDE 5: Proposed Solution
let s5 = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
s5.addText("4. Proposed Solution", { x: 0.5, y: 1.2, fontSize: 32, bold: true, color: "2c1810" });
s5.addText("A unified, full-stack web platform consisting of three main modules:", { x: 0.5, y: 1.8, w: '90%', fontSize: 20, color: "333333", italic: true });
s5.addText([
  { text: "Customer Interface:", options: { bold: true, color: "c4a484" } },
  { text: " Dynamic menu, voice search, smart checkout with multi-profile saving, and premium UI.\n", options: { breakLine: true } },
  { text: "Admin Command Center:", options: { bold: true, color: "c4a484" } },
  { text: " Real-time order tracking, live inventory sync, audio alerts, and manual/auto store controls.\n", options: { breakLine: true } },
  { text: "AI Engine (Sophie):", options: { bold: true, color: "c4a484" } },
  { text: " Context-aware chatbot that queries the live database for 100% accurate historical reporting and customer support.", options: { breakLine: true } }
], { x: 0.5, y: 2.3, w: '90%', fontSize: 20, color: "333333", bullet: true, lineSpacing: 26 });

// SLIDE 6: Technologies Used
let s6 = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
s6.addText("5. Technologies Used", { x: 0.5, y: 1.2, fontSize: 32, bold: true, color: "2c1810" });
s6.addText([
  { text: "Frontend Framework:", options: { bold: true } }, { text: " React.js (Context API, CSS Modules)", options: { breakLine: true } },
  { text: "Backend Architecture:", options: { bold: true } }, { text: " Node.js, Express.js", options: { breakLine: true } },
  { text: "Database:", options: { bold: true } }, { text: " MySQL (Relational, high integrity)", options: { breakLine: true } },
  { text: "AI Integration:", options: { bold: true } }, { text: " OpenAI API (Custom prompt engineering)", options: { breakLine: true } },
  { text: "Cloud Deployment:", options: { bold: true } }, { text: " Microsoft Azure", options: { breakLine: true } }
], { x: 0.5, y: 2.0, w: '90%', fontSize: 22, color: "333333", bullet: true, lineSpacing: 32 });
s6.addText("These technologies were selected to ensure scalability, real-time performance, and enterprise-grade security.", { x: 0.5, y: 4.5, w: '90%', fontSize: 18, color: "666666", italic: true });

// SLIDE 7: System Design
let s7 = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
s7.addText("6. System Design", { x: 0.5, y: 1.2, fontSize: 32, bold: true, color: "2c1810" });
s7.addText("[ Insert your ER Diagram, Architecture Diagram, or Flowchart here ]", { x: 0.5, y: 2.5, w: '90%', fontSize: 24, color: "999999", align: "center", bold: true });
s7.addText("Tip: Briefly explain the relationships between the User, Orders, Products, and Inventory tables during the presentation.", { x: 0.5, y: 3.5, w: '90%', fontSize: 16, color: "c4a484", align: "center", italic: true });

// SLIDE 8: Challenges and Solutions
let s8 = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
s8.addText("7. Challenges & Solutions", { x: 0.5, y: 1.2, fontSize: 32, bold: true, color: "2c1810" });
s8.addText([
  { text: "Challenge:", options: { bold: true, color: "991b1b" } }, { text: " AI Hallucinations providing incorrect prices to customers.\n", options: { breakLine: true } },
  { text: "Solution:", options: { bold: true, color: "15803d" } }, { text: " Implemented strict database grounding; Sophie fetches real-time prices before answering.\n", options: { breakLine: true } },
  { text: "Challenge:", options: { bold: true, color: "991b1b" } }, { text: " Browsers blocking the automated audio alarms for new orders.\n", options: { breakLine: true } },
  { text: "Solution:", options: { bold: true, color: "15803d" } }, { text: " Shifted to the Web Audio API triggered by initial user interaction on the dashboard.\n", options: { breakLine: true } },
  { text: "Challenge:", options: { bold: true, color: "991b1b" } }, { text: " Managing cart state and preventing orders for out-of-stock items.\n", options: { breakLine: true } },
  { text: "Solution:", options: { bold: true, color: "15803d" } }, { text: " Used React Context API combined with live backend validation.", options: { breakLine: true } }
], { x: 0.5, y: 1.8, w: '90%', fontSize: 18, color: "333333", lineSpacing: 24 });

// SLIDE 9: Conclusion
let s9 = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
s9.addText("8. Conclusion", { x: 0.5, y: 1.2, fontSize: 32, bold: true, color: "2c1810" });
s9.addText([
  { text: "Successfully developed a full-stack, production-ready system deployed on Azure.", options: { breakLine: true } },
  { text: "Dramatically improved operational efficiency for café management through automation and real-time tracking.", options: { breakLine: true } },
  { text: "Delivered a premium, high-end user experience that elevates the CaffAIne brand.", options: { breakLine: true } },
  { text: "Proved that AI can be practically integrated into daily F&B operations without sacrificing accuracy.", options: { breakLine: true } }
], { x: 0.5, y: 2.0, w: '90%', fontSize: 22, color: "333333", bullet: true, lineSpacing: 32 });

// SLIDE 10: Future Work
let s10 = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
s10.addText("9. Future Work", { x: 0.5, y: 1.2, fontSize: 32, bold: true, color: "2c1810" });
s10.addText([
  { text: "Mobile Application:", options: { bold: true } }, { text: " Porting the web interface to React Native for iOS and Android.", options: { breakLine: true } },
  { text: "Predictive Inventory AI:", options: { bold: true } }, { text: " Machine learning models to predict stock shortages before they happen based on weather and season.", options: { breakLine: true } },
  { text: "Loyalty Program:", options: { bold: true } }, { text: " Implementing a digital rewards system integrated with customer profiles.", options: { breakLine: true } },
  { text: "Payment Gateway:", options: { bold: true } }, { text: " Adding live credit card processing APIs (e.g., Stripe) instead of mock checkouts.", options: { breakLine: true } }
], { x: 0.5, y: 2.0, w: '90%', fontSize: 22, color: "333333", bullet: true, lineSpacing: 32 });

// SLIDE 11: Thank You
let s11 = pptx.addSlide();
s11.background = { color: "2c1810" };
s11.addText("Thank You!", { x: 0.5, y: 2.0, w: '90%', fontSize: 64, bold: true, color: "c4a484", fontFace: 'Georgia', align: 'center' });
s11.addText("Questions & Discussion", { x: 0.5, y: 3.2, w: '90%', fontSize: 28, color: "FFFFFF", align: 'center' });

pptx.writeFile({ fileName: 'CaffAIne_Official_Graduation_Presentation.pptx' })
  .then(fileName => {
    console.log(`Created official file: ${fileName}`);
  });
