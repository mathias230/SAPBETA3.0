import AppHeader from "@/components/layout/AppHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TeamsSection from "@/components/sections/TeamsSection";
import GroupsSection from "@/components/sections/GroupsSection";
import LeagueSection from "@/components/sections/LeagueSection";
import KnockoutSection from "@/components/sections/KnockoutSection";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-grow container mx-auto py-8 px-4">
        <Tabs defaultValue="teams" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="groups">Group Stage</TabsTrigger>
            <TabsTrigger value="league">League</TabsTrigger>
            <TabsTrigger value="knockout">Knockout</TabsTrigger>
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
        </Tabs>
      </main>
      <footer className="py-4 text-center text-sm text-muted-foreground border-t">
        Tournament Trackr by SAP - &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
