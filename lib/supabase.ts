import { createClient } from "@supabase/supabase-js";

// TypeScript interfaces for database structures
export interface DBConversation {
  id: string;
  created_at: string;
  user_message: string;
  ai_response: string;
  detected_mood: string;
  session_id: string;
}

export interface DBMemory {
  id: string;
  created_at: string;
  memory_type: string; // e.g. "preference", "struggle", "fear", "joy", "core"
  memory_text: string;
  emotional_weight: number; // 1 to 5 scale
  session_id: string;
}

// 1. Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const isSupabaseConfigured = supabaseUrl && supabaseAnonKey;

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// 2. Local Fallback Database (in-memory & localStorage) for bulletproof offline demos
class LocalMemoryDB {
  private getStorageKey(type: "conversations" | "memories"): string {
    return `echoes_local_${type}`;
  }

  private getItems<T>(type: "conversations" | "memories"): T[] {
    if (typeof window === "undefined") return [];
    try {
      const data = localStorage.getItem(this.getStorageKey(type));
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn("localStorage is not available, using in-memory store.", e);
      return [];
    }
  }

  private saveItems<T>(type: "conversations" | "memories", items: T[]) {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(this.getStorageKey(type), JSON.stringify(items));
    } catch (e) {
      console.warn("Failed to write to localStorage", e);
    }
  }

  async saveConversation(
    user_message: string,
    ai_response: string,
    detected_mood: string,
    session_id: string
  ): Promise<DBConversation> {
    const newItem: DBConversation = {
      id: Math.random().toString(36).substring(2, 11),
      created_at: new Date().toISOString(),
      user_message,
      ai_response,
      detected_mood,
      session_id,
    };

    const items = this.getItems<DBConversation>("conversations");
    items.unshift(newItem); // Newest first
    this.saveItems("conversations", items);

    console.log("💾 [LocalDB] Conversation turn stored:", newItem);
    return newItem;
  }

  async getRecentConversations(
    session_id: string,
    limit = 10
  ): Promise<DBConversation[]> {
    const items = this.getItems<DBConversation>("conversations");
    const filtered = session_id 
      ? items.filter((item) => item.session_id === session_id)
      : items;
    return filtered.slice(0, limit);
  }

  async saveMemory(
    memory_type: string,
    memory_text: string,
    emotional_weight: number,
    session_id: string
  ): Promise<DBMemory> {
    const items = this.getItems<DBMemory>("memories");
    
    // Define reinforcement keywords representing core psychological themes
    const coreKeywords = ["sleep", "insomnia", "tired", "fear", "fail", "lonel", "ambit", "career", "relationship", "music", "anxi", "sad", "unhappy", "parent", "mother", "father", "friend", "work", "stress"];
    
    // Find if there is an existing memory that shares a core theme keyword
    const lowercaseText = memory_text.toLowerCase();
    const activeKeyword = coreKeywords.find(kw => lowercaseText.includes(kw));

    let reinforcedIndex = -1;
    if (activeKeyword) {
      reinforcedIndex = items.findIndex(m => 
        m.session_id === session_id && m.memory_text.toLowerCase().includes(activeKeyword)
      );
    }

    let savedItem: DBMemory;

    if (reinforcedIndex !== -1) {
      // 🧠 Reinforcement logic: Increment weight (max 5) and update text
      const existing = items[reinforcedIndex];
      const newWeight = Math.min(5, existing.emotional_weight + 1);
      
      savedItem = {
        ...existing,
        memory_text, // Update to the latest phrasing
        memory_type,
        emotional_weight: newWeight,
        created_at: new Date().toISOString() // Refresh recency
      };
      
      items[reinforcedIndex] = savedItem;
      console.log(`🧠 [LocalDB] Theme reinforced! "${activeKeyword}" weight grew from ${existing.emotional_weight} -> ${newWeight}.`);
    } else {
      // Create new memory trace
      savedItem = {
        id: Math.random().toString(36).substring(2, 11),
        created_at: new Date().toISOString(),
        memory_type,
        memory_text,
        emotional_weight,
        session_id,
      };
      items.unshift(savedItem);
      console.log("🧠 [LocalDB] New memory trace registered:", savedItem);
    }

    // Save updated memory list
    this.saveItems("memories", items);
    return savedItem;
  }

  async getTopMemories(session_id: string, limit = 5): Promise<DBMemory[]> {
    const items = this.getItems<DBMemory>("memories");
    const filtered = session_id
      ? items.filter((m) => m.session_id === session_id)
      : items;

    const now = Date.now();
    const decayDuration = 3 * 60 * 1000; // 3 minutes decay threshold for live showcase / demo recency!
    
    // Dynamic Decay Simulation
    const decayedAndActive = filtered.map((m) => {
      const elapsed = now - new Date(m.created_at).getTime();
      
      // Core weight 4 or 5 memories never decay. Transient ones decay slowly:
      if (elapsed > decayDuration && m.emotional_weight < 4) {
        const decayedSteps = Math.floor(elapsed / decayDuration);
        const newWeight = Math.max(0, m.emotional_weight - decayedSteps);
        
        if (newWeight !== m.emotional_weight) {
          console.log(`🍂 [LocalDB] Memory decayed: "${m.memory_text}" weight reduced from ${m.emotional_weight} -> ${newWeight}`);
        }
        return { ...m, emotional_weight: newWeight };
      }
      return m;
    }).filter(m => m.emotional_weight > 0); // Discard completely decayed memories!

    // If any items decayed or dissolved, update database
    const hasChanges = decayedAndActive.length < filtered.length || 
      decayedAndActive.some((m) => {
        const orig = filtered.find(o => o.id === m.id);
        return orig && orig.emotional_weight !== m.emotional_weight;
      });

    if (hasChanges) {
      const allMemories = this.getItems<DBMemory>("memories");
      
      // Keep memories from other sessions, update/filter memories for this session
      const updatedAll = allMemories.map(m => {
        if (m.session_id === session_id) {
          return decayedAndActive.find(dm => dm.id === m.id);
        }
        return m;
      }).filter(Boolean) as DBMemory[];

      this.saveItems("memories", updatedAll);
    }

    // Sort by emotional weight (descending), then by recency
    return decayedAndActive
      .sort((a, b) => b.emotional_weight - a.emotional_weight || new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }

  async getEmotionalThemes(session_id: string): Promise<string[]> {
    const convs = await this.getRecentConversations(session_id, 15);
    const moods = convs.map((c) => c.detected_mood).filter(Boolean);
    
    const counts: Record<string, number> = {};
    moods.forEach((m) => {
      counts[m] = (counts[m] || 0) + 1;
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([mood]) => mood)
      .slice(0, 3);
  }
}

const localDB = new LocalMemoryDB();

// 3. Export Unified API Helpers that query real Supabase or fallback seamlessly
export async function dbSaveConversation(
  user_message: string,
  ai_response: string,
  detected_mood: string,
  session_id: string
): Promise<DBConversation> {
  if (!supabase) {
    return localDB.saveConversation(user_message, ai_response, detected_mood, session_id);
  }

  try {
    const { data, error } = await supabase
      .from("conversations")
      .insert([{ user_message, ai_response, detected_mood, session_id }])
      .select()
      .single();

    if (error) throw error;
    return data as DBConversation;
  } catch (err) {
    console.warn("Supabase saveConversation error, falling back to LocalDB:", err);
    return localDB.saveConversation(user_message, ai_response, detected_mood, session_id);
  }
}

export async function dbGetRecentConversations(
  session_id: string,
  limit = 10
): Promise<DBConversation[]> {
  if (!supabase) {
    return localDB.getRecentConversations(session_id, limit);
  }

  try {
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("session_id", session_id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as DBConversation[];
  } catch (err) {
    console.warn("Supabase getRecentConversations error, falling back to LocalDB:", err);
    return localDB.getRecentConversations(session_id, limit);
  }
}

export async function dbSaveMemory(
  memory_type: string,
  memory_text: string,
  emotional_weight: number,
  session_id: string
): Promise<DBMemory> {
  if (!supabase) {
    return localDB.saveMemory(memory_type, memory_text, emotional_weight, session_id);
  }

  try {
    // Note: Production cloud Supabase reinforcement/decay should ideally follow the same trigger procedures,
    // but for demo simplicity, we route database updates through the same local adapter logic to guarantee identical behavior!
    return localDB.saveMemory(memory_type, memory_text, emotional_weight, session_id);
  } catch (err) {
    console.warn("Supabase saveMemory error, falling back to LocalDB:", err);
    return localDB.saveMemory(memory_type, memory_text, emotional_weight, session_id);
  }
}

export async function dbGetTopMemories(
  session_id: string,
  limit = 5
): Promise<DBMemory[]> {
  if (!supabase) {
    return localDB.getTopMemories(session_id, limit);
  }

  try {
    return localDB.getTopMemories(session_id, limit);
  } catch (err) {
    console.warn("Supabase getTopMemories error, falling back to LocalDB:", err);
    return localDB.getTopMemories(session_id, limit);
  }
}

export async function dbGetEmotionalThemes(session_id: string): Promise<string[]> {
  if (!supabase) {
    return localDB.getEmotionalThemes(session_id);
  }

  try {
    const { data, error } = await supabase
      .from("conversations")
      .select("detected_mood")
      .eq("session_id", session_id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;
    
    const moods = data.map((d) => d.detected_mood).filter(Boolean);
    const counts: Record<string, number> = {};
    moods.forEach((m) => {
      counts[m] = (counts[m] || 0) + 1;
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([mood]) => mood)
      .slice(0, 3);
  } catch (err) {
    console.warn("Supabase getEmotionalThemes error, falling back to LocalDB:", err);
    return localDB.getEmotionalThemes(session_id);
  }
}
