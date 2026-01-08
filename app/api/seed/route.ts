import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { DEFAULT_QUESTION_TIMER } from "@/lib/types";

const ADMIN_KEY = process.env.ADMIN_KEY || "admin123";

const MEDICAL_QUESTIONS = [
    // ===== ROUND 1 (Turn 1) =====
    {
        roundId: "round-1",
        text: "What is the medical term for the 'voice box'?",
        type: "mcq",
        difficulty: "easy",
        choices: [{ text: "Pharynx" }, { text: "Larynx" }, { text: "Trachea" }, { text: "Esophagus" }],
        correctChoiceIndex: 1,
        order: 1
    },
    {
        roundId: "round-1",
        text: "Evaluate the following statements about the cardiovascular system:",
        type: "mtf",
        difficulty: "medium",
        statements: [
            { text: "The heart has four chambers", isTrue: true },
            { text: "Veins carry oxygenated blood to the heart", isTrue: false },
            { text: "The aorta is the largest artery in the body", isTrue: true },
            { text: "Blood pressure is measured in milliliters", isTrue: false }
        ],
        order: 2
    },
    {
        roundId: "round-1",
        text: "What is the name of the largest bone in the human body?",
        type: "saq",
        difficulty: "medium",
        correctAnswer: "femur",
        order: 3
    },
    {
        roundId: "round-1",
        text: "Identify the structure indicated by the arrow in this anatomical image (hint: it's in the respiratory system):",
        type: "spot",
        difficulty: "difficult",
        correctAnswer: "trachea",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Gray622.png/220px-Gray622.png",
        order: 4
    },
    // ===== ROUND 2 (Turn 2) =====
    {
        roundId: "round-2",
        text: "Which organ is primarily responsible for detoxifying chemicals in the body?",
        type: "mcq",
        difficulty: "easy",
        choices: [{ text: "Kidney" }, { text: "Liver" }, { text: "Pancreas" }, { text: "Spleen" }],
        correctChoiceIndex: 1,
        order: 1
    },
    {
        roundId: "round-2",
        text: "Evaluate the following statements about blood types:",
        type: "mtf",
        difficulty: "medium",
        statements: [
            { text: "Type O blood is the universal donor", isTrue: true },
            { text: "Type AB blood can only receive from AB donors", isTrue: false },
            { text: "Rh factor determines if blood is positive or negative", isTrue: true },
            { text: "Type A blood has B antibodies", isTrue: true }
        ],
        order: 2
    },
    {
        roundId: "round-2",
        text: "What vitamin is synthesized by the skin upon exposure to sunlight?",
        type: "saq",
        difficulty: "medium",
        correctAnswer: "vitamin d",
        order: 3
    },
    {
        roundId: "round-2",
        text: "Identify the organ shown in this cross-sectional image:",
        type: "spot",
        difficulty: "difficult",
        correctAnswer: "kidney",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Kidney_Cross_Section.png/220px-Kidney_Cross_Section.png",
        order: 4
    },
    // ===== ROUND 3 (Turn 3) =====
    {
        roundId: "round-3",
        text: "Which hormone is known as the 'stress hormone'?",
        type: "mcq",
        difficulty: "medium",
        choices: [{ text: "Adrenaline" }, { text: "Cortisol" }, { text: "Testosterone" }, { text: "Melatonin" }],
        correctChoiceIndex: 1,
        order: 1
    },
    {
        roundId: "round-3",
        text: "Evaluate the following statements about diabetes:",
        type: "mtf",
        difficulty: "difficult",
        statements: [
            { text: "Type 1 diabetes is an autoimmune disease", isTrue: true },
            { text: "Type 2 diabetes is always caused by obesity", isTrue: false },
            { text: "Insulin is produced by the pancreas", isTrue: true },
            { text: "HbA1c measures average blood sugar over 3 months", isTrue: true }
        ],
        order: 2
    },
    {
        roundId: "round-3",
        text: "What is the medical term for high blood pressure?",
        type: "saq",
        difficulty: "medium",
        correctAnswer: "hypertension",
        order: 3
    },
    {
        roundId: "round-3",
        text: "Identify the bone structure shown:",
        type: "spot",
        difficulty: "difficult",
        correctAnswer: "vertebra",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Lumbar_vertebra.gif/220px-Lumbar_vertebra.gif",
        order: 4
    },
    // ===== ROUND 4 (Turn 4) =====
    {
        roundId: "round-4",
        text: "What is the largest organ of the human body?",
        type: "mcq",
        difficulty: "medium",
        choices: [{ text: "Brain" }, { text: "Liver" }, { text: "Skin" }, { text: "Heart" }],
        correctChoiceIndex: 2,
        order: 1
    },
    {
        roundId: "round-4",
        text: "Evaluate the following statements about the nervous system:",
        type: "mtf",
        difficulty: "difficult",
        statements: [
            { text: "Neurons can regenerate after injury", isTrue: false },
            { text: "The blood-brain barrier protects the brain from pathogens", isTrue: true },
            { text: "Dopamine is associated with reward and pleasure", isTrue: true },
            { text: "The spinal cord ends at the base of the skull", isTrue: false }
        ],
        order: 2
    },
    {
        roundId: "round-4",
        text: "What is the normal pH range of human blood?",
        type: "saq",
        difficulty: "difficult",
        correctAnswer: "7.35-7.45",
        order: 3
    },
    {
        roundId: "round-4",
        text: "Identify the brain structure highlighted:",
        type: "spot",
        difficulty: "difficult",
        correctAnswer: "cerebellum",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Cerebellum_animation_small.gif/220px-Cerebellum_animation_small.gif",
        order: 4
    },
    // ===== ROUND 5 (Turn 5) =====
    {
        roundId: "round-5",
        text: "Which cranial nerve is responsible for the gag reflex?",
        type: "mcq",
        difficulty: "difficult",
        choices: [{ text: "Trigeminal (V)" }, { text: "Facial (VII)" }, { text: "Glossopharyngeal (IX)" }, { text: "Vagus (X)" }],
        correctChoiceIndex: 2,
        order: 1
    },
    {
        roundId: "round-5",
        text: "Evaluate the following statements about antibodies:",
        type: "mtf",
        difficulty: "difficult",
        statements: [
            { text: "IgG is the most abundant antibody in blood", isTrue: true },
            { text: "IgE is involved in allergic reactions", isTrue: true },
            { text: "IgM is the first antibody produced in an immune response", isTrue: true },
            { text: "IgA is primarily found in the bloodstream", isTrue: false }
        ],
        order: 2
    },
    {
        roundId: "round-5",
        text: "What part of the nephron is primarily responsible for filtration?",
        type: "saq",
        difficulty: "difficult",
        correctAnswer: "glomerulus",
        order: 3
    },
    {
        roundId: "round-5",
        text: "Identify the heart structure indicated:",
        type: "spot",
        difficulty: "difficult",
        correctAnswer: "mitral valve",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Heart_labelled_large.png/220px-Heart_labelled_large.png",
        order: 4
    }
];

const BOT_NAMES = [
    "MedBot Alpha", "NeuroNet", "CardioAI", "PharmaTech", "BioLogic",
    "SynapseBot", "HelixTeam", "CellularAI", "GenomeX", "PulseCheck",
    "VitalSign", "DiagnoBot", "LabRat Pro", "MedMinds", "CureCore",
    "HealthHex", "BioBeam", "MedMatrix", "NervePulse", "OxygenPro",
    "BloodFlow", "BrainWave", "HeartBeat", "LungPower", "KidneyAid",
    "LiverLink", "BoneBot", "SkinShield", "EyeCare", "EarDrum"
];

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");
    const action = searchParams.get("action") || "seed";

    if (key !== ADMIN_KEY) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        if (action === "seed") {
            const batch = adminDb.batch();

            for (let i = 1; i <= 5; i++) {
                const rRef = adminDb.collection("rounds").doc(`round-${i}`);
                batch.set(rRef, {
                    id: `round-${i}`,
                    status: "waiting",
                    startTime: null,
                    currentQuestionIndex: 0,
                    questionTimer: DEFAULT_QUESTION_TIMER
                }, { merge: true });
            }

            MEDICAL_QUESTIONS.forEach((q) => {
                const qId = `q-${q.roundId}-${q.order}`;
                const qRef = adminDb.collection("questions").doc(qId);
                batch.set(qRef, { ...q, id: qId });
            });

            await batch.commit();

            return NextResponse.json({
                success: true,
                message: `Seeded ${MEDICAL_QUESTIONS.length} questions across 5 rounds.`
            });
        }

        if (action === "fillbots") {
            const teamsSnap = await adminDb.collection("teams").get();
            const existingTeams = teamsSnap.docs.map(d => d.data());

            const batch = adminDb.batch();
            let botsAdded = 0;

            for (let group = 1; group <= 5; group++) {
                const groupTeams = existingTeams.filter(t => t.group === group);
                const needed = 6 - groupTeams.length;

                for (let i = 0; i < needed; i++) {
                    const botName = BOT_NAMES[botsAdded % BOT_NAMES.length] + ` G${group}`;
                    const botRef = adminDb.collection("teams").doc();
                    batch.set(botRef, {
                        name: botName,
                        group: group,
                        score: 0,
                        status: "active",
                        isBot: true,
                        challengesRemaining: 2,
                        streak: 0,
                        createdAt: new Date()
                    });
                    botsAdded++;
                }
            }

            await batch.commit();

            return NextResponse.json({
                success: true,
                message: `Added ${botsAdded} bots to fill teams to 30.`
            });
        }

        if (action === "removebots") {
            const teamsSnap = await adminDb.collection("teams").where("isBot", "==", true).get();

            const batch = adminDb.batch();
            let botsRemoved = 0;

            teamsSnap.docs.forEach(doc => {
                batch.delete(doc.ref);
                botsRemoved++;
            });

            await batch.commit();

            return NextResponse.json({
                success: true,
                message: `Removed ${botsRemoved} bots from the game.`
            });
        }

        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to execute action" }, { status: 500 });
    }
}
