import ChatComponent from "@/components/ChatComponent";
import FileUploadComponent from "@/components/FileUploadComponent";

const Index = () => {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Left Sidebar - File Upload */}
      <aside className="w-80 border-r border-border bg-card flex-shrink-0">
        <FileUploadComponent />
      </aside>

      {/* Right Main Area - Chat */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <ChatComponent />
      </main>
    </div>
  );
};

export default Index;
