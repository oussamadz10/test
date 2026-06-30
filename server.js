// استبدل هذا بالرابط الخاص بك على فيرسيل ex: https://your-app.vercel.app/api/analyze-devis
const SERVER_URL = "https://your-backend-url.vercel.app/api/analyze-devis";

async function processAIStep3WithServer() {
    const userDescription = document.getElementById('ai-description').value;

    if (!userDescription.trim()) {
        alert("Veuillez détaillez vos travaux.");
        return;
    }

    try {
        // محاولة الاتصال بالسيرفر الخارجي
        const response = await fetch(SERVER_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ description: userDescription })
        });

        // 1. إذا استجاب السيرفر ولكن برمز خطأ (مثل خطأ 500 للذكاء الاصطناعي)
        if (!response.ok) {
            throw new Error(`Le serveur a répondu avec un statut : ${response.status}`);
        }

        const data = await response.json();
        console.log("البيانات قادمة بنجاح من السيرفر الخارجي:", data);

        // هنا يتم ملء الجدول بناءً على رد السيرفر الذكي...
        goToStep(3);

    } catch (error) {
        // 2. إذا فشل الاتصال تماماً (السيرفر مغلق أو الرابط خاطئ أو مشكلة CORS)
        console.error("خطأ في الاتصال بالسيرفر:", error);
        alert("❌ السيرفر الخارجي غير متصل أو واجه مشكلة! تفاصيل: " + error.message);
    }
}
