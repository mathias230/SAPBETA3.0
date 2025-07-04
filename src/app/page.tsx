
import AppHeader from "@/components/layout/AppHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TeamsSection from "@/components/sections/TeamsSection";
import GroupsSection from "@/components/sections/GroupsSection";
import LeagueSection from "@/components/sections/LeagueSection";
import KnockoutSection from "@/components/sections/KnockoutSection";
import HistorySection from "@/components/sections/HistorySection"; // New import

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-grow container mx-auto py-8 px-4">
        <Tabs defaultValue="teams" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 mb-6"> {/* Adjusted grid columns */}
            <TabsTrigger value="teams">Equipos</TabsTrigger>
            <TabsTrigger value="groups">Fase de Grupos</TabsTrigger>
            <TabsTrigger value="league">Liga</TabsTrigger>
            <TabsTrigger value="knockout">Eliminatorias</TabsTrigger>
            <TabsTrigger value="history">Historial</TabsTrigger> {/* New Tab */}
          </TabsList>
          <TabsContent value="teams">
            <TeamsSection />
          </TabsContent>
          <TabsContent value="groups">
            <GroupsSection />
          </TabsContent>
          <TabsContent value="league">
            <LeagueSection />
          </TabsContent>
          <TabsContent value="knockout">
            <KnockoutSection />
          </TabsContent>
          <TabsContent value="history"> {/* New Tab Content */}
            <HistorySection />
          </TabsContent>
        </Tabs>
      </main>
      <footer className="py-4 text-center text-sm text-muted-foreground border-t">
        Gestor de Torneos por SAP - &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
