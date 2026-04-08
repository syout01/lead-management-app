"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ActivityType, ACTIVITY_TYPE_LABELS } from "@/lib/types";
import { addActivity } from "@/lib/use-store";
import { useAuth } from "@/lib/auth-context";
import { Phone, Mail, Users, MoreHorizontal } from "lucide-react";

const ACTIVITY_ICONS: Record<ActivityType, React.ReactNode> = {
  call: <Phone className="w-4 h-4" />,
  email: <Mail className="w-4 h-4" />,
  meeting: <Users className="w-4 h-4" />,
  other: <MoreHorizontal className="w-4 h-4" />,
};

interface ActivityFormProps {
  leadId: string;
  onSaved: () => void;
}

export function ActivityForm({ leadId, onSaved }: ActivityFormProps) {
  const { user } = useAuth();
  const [type, setType] = useState<ActivityType>("call");
  const [content, setContent] = useState("");
  const [result, setResult] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    await addActivity({
      leadId,
      type,
      content: content.trim(),
      result: result.trim(),
      createdBy: user?.user_metadata?.display_name || "自分",
    }, user?.id);

    setContent("");
    setResult("");
    onSaved();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* クイックタイプ選択 */}
      <div className="flex gap-2">
        {(Object.keys(ACTIVITY_TYPE_LABELS) as ActivityType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              type === t
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {ACTIVITY_ICONS[t]}
            {ACTIVITY_TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      <div>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="対応内容を入力..."
          rows={2}
          required
        />
      </div>

      <div>
        <Input
          value={result}
          onChange={(e) => setResult(e.target.value)}
          placeholder="結果（例：アポ獲得、資料送付了承）"
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={!content.trim()}>
          記録する
        </Button>
      </div>
    </form>
  );
}
