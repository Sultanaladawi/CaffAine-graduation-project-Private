const pptxgen = require('pptxgenjs');

let pptx = new pptxgen();
pptx.author = 'CaffAIne Team';
pptx.company = 'Al-Balqa Applied University';
pptx.subject = 'Graduation Project Presentation';
pptx.title = 'CaffAIne Coffee';

// Title Slide
let slide1 = pptx.addSlide();
slide1.background = { color: "F8EEE6" };
slide1.addText("CaffAIne Coffee.", { x: 1, y: 2, w: '80%', fontSize: 44, bold: true, color: "2c1810", fontFace: 'Georgia' });
slide1.addText("The Future of Specialty Coffee — Driven by Intelligence and Craft.", { x: 1, y: 3, w: '80%', fontSize: 24, color: "c4a484", fontFace: 'Arial' });
slide1.addText("Graduation Project Defense", { x: 1, y: 4.5, w: '80%', fontSize: 18, color: "7A5238", fontFace: 'Arial' });

// Problem Statement
let slide2 = pptx.addSlide();
slide2.background = { color: "FFFFFF" };
slide2.addText("Why CaffAIne?", { x: 0.5, y: 0.5, fontSize: 32, bold: true, color: "2c1810", border: [0,0,{pt:2,color:'c4a484'},0] });
slide2.addText([
  { text: "Customer Experience:", options: { bold: true } },
  { text: " Online specialty coffee lacks the personalized touch.\n", options: { breakLine: true } },
  { text: "Business Management:", options: { bold: true } },
  { text: " Coffee shop owners struggle with inventory & complex orders.\n", options: { breakLine: true } },
  { text: "The Solution:", options: { bold: true } },
  { text: " A unified platform with a beautiful interface and a robust AI-driven admin dashboard.", options: { breakLine: true } }
], { x: 0.5, y: 1.5, w: '90%', fontSize: 20, color: "333333", bullet: true });
slide2.addNotes("The specialty coffee market is growing, but digital solutions for independent shops remain fragmented. We wanted to build a platform that gives customers a premium browsing experience, while giving management complete, centralized control over orders, inventory, and analytics.");

// Customer Experience
let slide3 = pptx.addSlide();
slide3.background = { color: "FFFFFF" };
slide3.addText("A Premium Digital Experience", { x: 0.5, y: 0.5, fontSize: 32, bold: true, color: "2c1810", border: [0,0,{pt:2,color:'c4a484'},0] });
slide3.addText([
  { text: "Modern, dynamic, and responsive design tailored for specialty coffee aesthetics.", options: { breakLine: true } },
  { text: "Interactive bilingual menu (English & Arabic) with Voice Search integration.", options: { breakLine: true } },
  { text: "Smart checkout system that remembers multiple customer profiles for returning users.", options: { breakLine: true } }
], { x: 0.5, y: 1.5, w: '90%', fontSize: 20, color: "333333", bullet: true });
slide3.addNotes("For the customer, the interface is designed to feel as premium as the coffee itself. The menu is fully responsive and features an intelligent search bar that supports both Arabic and English text, as well as Voice Search for maximum convenience.");

// Admin Dashboard
let slide4 = pptx.addSlide();
slide4.background = { color: "FFFFFF" };
slide4.addText("The Strategic Dashboard", { x: 0.5, y: 0.5, fontSize: 32, bold: true, color: "2c1810", border: [0,0,{pt:2,color:'c4a484'},0] });
slide4.addText([
  { text: "Comprehensive overview of revenue, daily orders, and system health.", options: { breakLine: true } },
  { text: "Real-time urgent alerts (Web Audio API alarms for low stock and new orders).", options: { breakLine: true } },
  { text: "Instant toggling of store status (Auto, Manual Open, Manual Closed).", options: { breakLine: true } }
], { x: 0.5, y: 1.5, w: '90%', fontSize: 20, color: "333333", bullet: true });
slide4.addNotes("Behind the scenes is the Admin Dashboard. This is the command center. Management can instantly see daily revenue, active orders, and low-stock items. We even built in a Web Audio API alarm system that alerts the barista immediately when a new order arrives or stock drops below critical levels.");

// AI Assistant
let slide5 = pptx.addSlide();
slide5.background = { color: "FFFFFF" };
slide5.addText("Sophie: The AI Barista & Analytics Engine", { x: 0.5, y: 0.5, fontSize: 32, bold: true, color: "2c1810", border: [0,0,{pt:2,color:'c4a484'},0] });
slide5.addText([
  { text: "Analyzes the entire database history to provide 100% accurate insights.", options: { breakLine: true } },
  { text: "Answers complex queries (e.g., 'What was the most popular item last month?').", options: { breakLine: true } },
  { text: "Provides personalized recommendations to customers on the public site.", options: { breakLine: true } }
], { x: 0.5, y: 1.5, w: '90%', fontSize: 20, color: "333333", bullet: true });
slide5.addNotes("One of the standout features of CaffAIne is Sophie, our AI assistant. For customers, Sophie acts as a friendly digital barista. For management, Sophie connects directly to our MySQL database to analyze the entire history of orders, instantly generating reports and business insights without hallucinating data.");

// Architecture
let slide6 = pptx.addSlide();
slide6.background = { color: "FFFFFF" };
slide6.addText("Technical Architecture", { x: 0.5, y: 0.5, fontSize: 32, bold: true, color: "2c1810", border: [0,0,{pt:2,color:'c4a484'},0] });
slide6.addText([
  { text: "Frontend:", options: { bold: true } }, { text: " React.js, CSS Modules, Modern Hooks.", options: { breakLine: true } },
  { text: "Backend:", options: { bold: true } }, { text: " Node.js, Express.", options: { breakLine: true } },
  { text: "Database:", options: { bold: true } }, { text: " MySQL (Hosted on Azure).", options: { breakLine: true } },
  { text: "Deployment:", options: { bold: true } }, { text: " Fully deployed and running securely on Microsoft Azure.", options: { breakLine: true } }
], { x: 0.5, y: 1.5, w: '90%', fontSize: 20, color: "333333", bullet: true });

// Conclusion
let slide7 = pptx.addSlide();
slide7.background = { color: "F8EEE6" };
slide7.addText("Conclusion & Future Scope", { x: 0.5, y: 0.5, fontSize: 32, bold: true, color: "2c1810", border: [0,0,{pt:2,color:'c4a484'},0] });
slide7.addText([
  { text: "CaffAIne successfully bridges the gap between traditional coffee craft and modern technology.", options: { breakLine: true } },
  { text: "Future possibilities: Mobile App integration, advanced predictive AI for inventory ordering, and loyalty program expansion.", options: { breakLine: true } }
], { x: 0.5, y: 1.5, w: '90%', fontSize: 20, color: "333333", bullet: true });
slide7.addText("Thank You! Questions?", { x: 0.5, y: 4, w: '90%', fontSize: 32, bold: true, color: "c4a484", align: "center" });

pptx.writeFile({ fileName: 'CaffAIne_Graduation_Presentation.pptx' })
  .then(fileName => {
    console.log(`Created file: ${fileName}`);
  });
