import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

const MEDICAL_QUESTIONS = [
    // Round 1 - 5 MCQ questions
    {
        roundId: "round-1",
        text: "What is the medical term for the 'voice box'?",
        type: "mcq",
        choices: [{ text: "Pharynx" }, { text: "Larynx" }, { text: "Trachea" }, { text: "Esophagus" }],
        correctChoiceIndex: 1,
        order: 1
    },
    {
        roundId: "round-1",
        text: "Which vitamin is synthesized by the skin upon exposure to sunlight?",
        type: "mcq",
        choices: [{ text: "Vitamin A" }, { text: "Vitamin C" }, { text: "Vitamin D" }, { text: "Vitamin K" }],
        correctChoiceIndex: 2,
        order: 2
    },
    {
        roundId: "round-1",
        text: "What is the normal resting heart rate for adults?",
        type: "mcq",
        choices: [{ text: "40-60 bpm" }, { text: "60-100 bpm" }, { text: "100-120 bpm" }, { text: "120-140 bpm" }],
        correctChoiceIndex: 1,
        order: 3
    },
    {
        roundId: "round-1",
        text: "Which blood type is known as the universal donor?",
        type: "mcq",
        choices: [{ text: "A" }, { text: "B" }, { text: "AB" }, { text: "O" }],
        correctChoiceIndex: 3,
        order: 4
    },
    {
        roundId: "round-1",
        text: "The pancreas produces which hormone to regulate blood sugar?",
        type: "mcq",
        choices: [{ text: "Glucagon only" }, { text: "Insulin only" }, { text: "Both Insulin and Glucagon" }, { text: "Cortisol" }],
        correctChoiceIndex: 2,
        order: 5
    },

    // Round 2 - 5 MCQ questions
    {
        roundId: "round-2",
        text: "Which organ is primarily responsible for detoxifying chemicals in the body?",
        type: "mcq",
        choices: [{ text: "Kidney" }, { text: "Liver" }, { text: "Pancreas" }, { text: "Spleen" }],
        correctChoiceIndex: 1,
        order: 1
    },
    {
        roundId: "round-2",
        text: "What is the largest bone in the human body?",
        type: "mcq",
        choices: [{ text: "Tibia" }, { text: "Humerus" }, { text: "Femur" }, { text: "Pelvis" }],
        correctChoiceIndex: 2,
        order: 2
    },
    {
        roundId: "round-2",
        text: "Which part of the brain controls balance and coordination?",
        type: "mcq",
        choices: [{ text: "Cerebrum" }, { text: "Cerebellum" }, { text: "Medulla" }, { text: "Hypothalamus" }],
        correctChoiceIndex: 1,
        order: 3
    },
    {
        roundId: "round-2",
        text: "What is the medical term for high blood pressure?",
        type: "mcq",
        choices: [{ text: "Hypotension" }, { text: "Hypertension" }, { text: "Tachycardia" }, { text: "Bradycardia" }],
        correctChoiceIndex: 1,
        order: 4
    },
    {
        roundId: "round-2",
        text: "Which type of white blood cell is most abundant?",
        type: "mcq",
        choices: [{ text: "Lymphocytes" }, { text: "Monocytes" }, { text: "Neutrophils" }, { text: "Eosinophils" }],
        correctChoiceIndex: 2,
        order: 5
    },

    // Round 3 - Essay + MCQ (Elimination starts)
    {
        roundId: "round-3",
        text: "Explain the primary difference between Type 1 and Type 2 Diabetes.",
        type: "essay",
        order: 1
    },
    {
        roundId: "round-3",
        text: "What is the heaviest internal organ in the human body?",
        type: "mcq",
        choices: [{ text: "Brain" }, { text: "Liver" }, { text: "Lungs" }, { text: "Heart" }],
        correctChoiceIndex: 1,
        order: 2
    },
    {
        roundId: "round-3",
        text: "Which hormone is known as the 'stress hormone'?",
        type: "mcq",
        choices: [{ text: "Adrenaline" }, { text: "Cortisol" }, { text: "Testosterone" }, { text: "Melatonin" }],
        correctChoiceIndex: 1,
        order: 3
    },

    // Round 4
    {
        roundId: "round-4",
        text: "What is the largest organ of the human body?",
        type: "mcq",
        choices: [{ text: "Brain" }, { text: "Liver" }, { text: "Skin" }, { text: "Heart" }],
        correctChoiceIndex: 2,
        order: 1
    },
    {
        roundId: "round-4",
        text: "Which antibody is most abundant in human blood?",
        type: "mcq",
        choices: [{ text: "IgA" }, { text: "IgE" }, { text: "IgG" }, { text: "IgM" }],
        correctChoiceIndex: 2,
        order: 2
    },
    {
        roundId: "round-4",
        text: "Describe the function of the blood-brain barrier.",
        type: "essay",
        order: 3
    },

    // Round 5
    {
        roundId: "round-5",
        text: "What is the normal pH range of human blood?",
        type: "mcq",
        choices: [{ text: "6.8 - 7.0" }, { text: "7.35 - 7.45" }, { text: "7.5 - 7.8" }, { text: "8.0 - 8.5" }],
        correctChoiceIndex: 1,
        order: 1
    },
    {
        roundId: "round-5",
        text: "Which part of the nephron is primarily responsible for filtration?",
        type: "mcq",
        choices: [{ text: "Loop of Henle" }, { text: "Glomerulus" }, { text: "Collecting duct" }, { text: "Distal tubule" }],
        correctChoiceIndex: 1,
        order: 2
    },

    // Round 6
    {
        roundId: "round-6",
        text: "What is the primary function of hemoglobin?",
        type: "mcq",
        choices: [{ text: "Blood clotting" }, { text: "Oxygen transport" }, { text: "Immune response" }, { text: "Hormone regulation" }],
        correctChoiceIndex: 1,
        order: 1
    },
    {
        roundId: "round-6",
        text: "Explain the mechanism of action of beta-blockers.",
        type: "essay",
        order: 2
    },

    // Round 7 (Final)
    {
        roundId: "round-7",
        text: "Which cranial nerve is responsible for the gag reflex?",
        type: "mcq",
        choices: [{ text: "Trigeminal (V)" }, { text: "Facial (VII)" }, { text: "Glossopharyngeal (IX)" }, { text: "Vagus (X)" }],
        correctChoiceIndex: 2,
        order: 1
    },
    {
        roundId: "round-7",
        text: "Discuss the potential implications of CRISPR-Cas9 technology in treating genetic disorders.",
        type: "essay",
        order: 2
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

    if (key !== "admin123") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        if (action === "seed") {
            const batch = adminDb.batch();

            // 1. Create Rounds with timer settings
            for (let i = 1; i <= 7; i++) {
                const rRef = adminDb.collection("rounds").doc(`round-${i}`);
                batch.set(rRef, {
                    id: `round-${i}`,
                    status: "waiting",
                    startTime: null,
                    currentQuestionIndex: 0,
                    questionTimer: 10 // 10 seconds per question
                }, { merge: true });
            }

            // 2. Add Questions
            MEDICAL_QUESTIONS.forEach((q, idx) => {
                const qId = `q-${q.roundId}-${q.order}`;
                const qRef = adminDb.collection("questions").doc(qId);
                batch.set(qRef, { ...q, id: qId });
            });

            await batch.commit();

            return NextResponse.json({
                success: true,
                message: `Seeded ${MEDICAL_QUESTIONS.length} questions across 7 rounds.`
            });
        }

        if (action === "fillbots") {
            // Get current team count per group
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
            // Remove all bot teams
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
