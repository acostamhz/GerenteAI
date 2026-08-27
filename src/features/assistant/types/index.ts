export interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  metricWidget?: {
    title: string;
    value: string;
    percentage: string;
    progress: number;
  };
  actionButton?: {
    label: string;
    href: string;
  };
}

export interface QuickPrompt {
  id: string;
  label: string;
  query: string;
  iconName?: string;
}
