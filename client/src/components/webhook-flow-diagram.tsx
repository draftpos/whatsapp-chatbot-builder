import { ArrowRight, MessageSquare, Webhook, Server, CheckCircle } from "lucide-react";

export function WebhookFlowDiagram() {
  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="text-lg font-semibold mb-4">How Webhooks Work</h3>
      
      <div className="flex items-center justify-between space-x-4">
        {/* Step 1: User sends message */}
        <div className="flex flex-col items-center text-center flex-1">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
            <MessageSquare className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-sm font-medium">User sends message</p>
          <p className="text-xs text-gray-500 mt-1">Via WhatsApp</p>
        </div>

        <ArrowRight className="w-6 h-6 text-gray-400" />

        {/* Step 2: WhatsApp receives */}
        <div className="flex flex-col items-center text-center flex-1">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-2">
            <Server className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-sm font-medium">WhatsApp server</p>
          <p className="text-xs text-gray-500 mt-1">Processes message</p>
        </div>

        <ArrowRight className="w-6 h-6 text-gray-400" />

        {/* Step 3: Webhook sent */}
        <div className="flex flex-col items-center text-center flex-1">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-2">
            <Webhook className="w-8 h-8 text-purple-600" />
          </div>
          <p className="text-sm font-medium">Webhook sent</p>
          <p className="text-xs text-gray-500 mt-1">To your URL</p>
        </div>

        <ArrowRight className="w-6 h-6 text-gray-400" />

        {/* Step 4: App receives */}
        <div className="flex flex-col items-center text-center flex-1">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-2">
            <CheckCircle className="w-8 h-8 text-orange-600" />
          </div>
          <p className="text-sm font-medium">WhatsWay receives</p>
          <p className="text-xs text-gray-500 mt-1">Updates inbox</p>
        </div>
      </div>

      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <p className="text-sm text-gray-600">
          <strong>Your webhook URL format:</strong> {window.location.origin}/webhook/[your-channel-id]
        </p>
      </div>
    </div>
  );
}