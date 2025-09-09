import Navigation from "@/components/Navigation";
import FaceComparison from "@/components/FaceComparison";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-16">
        <FaceComparison />
      </main>
    </div>
  );
};

export default Index;
