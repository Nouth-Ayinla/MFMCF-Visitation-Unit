import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Search, CheckCircle2, Calendar, MapPin, Sparkles, UserCheck, ArrowRight, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import heroBackground from "@/assets/fellowship-background.jpg";
import mfmLogo from "@/assets/mfm-logo.png";

type ServiceType = "bible_study" | "revival_hour" | "sunday_service";

const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  bible_study: "Bible Study",
  revival_hour: "Revival Hour",
  sunday_service: "Sunday Service",
};

interface MemberSearchResult {
  id: string;
  full_name: string;
  level_number: string | null;
  department_name: string | null;
}

const PublicAttendance = () => {
  const { toast } = useToast();
  const [serviceType, setServiceType] = useState<ServiceType>("sunday_service");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<MemberSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberSearchResult | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMemberName, setSuccessMemberName] = useState<string | null>(null);

  // Debounced search logic
  useEffect(() => {
    if (searchTerm.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(() => {
      performSearch(searchTerm.trim());
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const performSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const { data, error } = await supabase.rpc("search_members_public", {
        p_search_query: query,
      });

      if (error) {
        throw error;
      }

      setSearchResults((data as MemberSearchResult[]) || []);
    } catch (error: any) {
      console.error("Search failed:", error);
      toast({
        title: "Search Error",
        description: "Could not retrieve member list. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleMemberSelect = (member: MemberSearchResult) => {
    setSelectedMember(member);
    setIsConfirmOpen(true);
  };

  const handleMarkPresent = async () => {
    if (!selectedMember) return;

    setIsSubmitting(true);
    const today = new Date().toISOString().split("T")[0];

    try {
      const { data, error } = await supabase.rpc("mark_self_attendance", {
        p_member_id: selectedMember.id,
        p_service_type: serviceType,
        p_attendance_date: today,
      });

      if (error) {
        throw error;
      }

      const response = data as { success: boolean; error?: string };

      if (!response.success) {
        toast({
          title: "Attendance Notice",
          description: response.error || "Attendance already marked for today.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `Attendance marked for ${selectedMember.full_name}`,
        });
        setSuccessMemberName(selectedMember.full_name);
        setSearchTerm("");
        setSearchResults([]);
      }
    } catch (error: any) {
      console.error("Attendance submission failed:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to mark attendance. Please contact an admin.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setIsConfirmOpen(false);
      setSelectedMember(null);
    }
  };

  const handleReset = () => {
    setSuccessMemberName(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      {/* Top Banner / Hero */}
      <div
        className="relative h-[25vh] min-h-[180px] bg-cover bg-center flex items-center justify-center"
        style={{ backgroundImage: `url(${heroBackground})` }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 text-center px-4 flex flex-col items-center justify-center">
          <img
            src={mfmLogo}
            alt="MFM CF Logo"
            className="w-16 h-16 mb-2 bg-white rounded-full p-1.5 shadow-md"
          />
          <h1 className="text-xl sm:text-3xl font-bold text-white tracking-wide">
            MFMCF FUTA CHAPTER
          </h1>
          <p className="text-lg sm:text-xl font-medium text-[#c05dec] mt-0.5">
            Member Attendance
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow max-w-md sm:max-w-xl mx-auto px-4 py-8 w-full">
        {successMemberName ? (
          /* Success Screen */
          <Card className="border border-[#8920AC]/30 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="bg-[#8920AC]/10 p-6 flex justify-center items-center border-b border-muted">
              <div className="bg-[#8920AC] text-white p-4 rounded-full shadow-lg ring-4 ring-[#8920AC]/20">
                <UserCheck className="h-10 w-10 animate-bounce" />
              </div>
            </div>
            <CardContent className="pt-8 text-center space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-black">Attendance Marked!</h2>
                <p className="text-muted-foreground mt-2">
                  Thank you, <span className="font-semibold text-black">{successMemberName}</span>, your attendance has been recorded for the <span className="font-medium text-black">{SERVICE_TYPE_LABELS[serviceType]}</span>.
                </p>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg flex items-center gap-3 justify-center text-sm border border-muted">
                <Calendar className="h-4 w-4 text-[#8920AC]" />
                <span className="font-medium text-black">Date: {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>

              <div className="pt-4 flex flex-col gap-3">
                <Button
                  onClick={handleReset}
                  className="bg-[#8920AC] hover:bg-[#7a1c98] text-white rounded-full h-12 text-base font-semibold shadow-md transition-all w-full"
                >
                  Mark for Another Person
                  <Sparkles className="ml-2 h-4 w-4" />
                </Button>
                <Link to="/" className="w-full">
                  <Button variant="ghost" className="w-full text-black h-12 hover:bg-muted text-sm font-medium">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to First Timer Registration
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Search & Mark Screen */
          <div className="space-y-6">
            {/* Nav link back to home */}
            <div className="flex justify-between items-center bg-[#8920AC]/5 border border-[#8920AC]/10 rounded-full px-4 py-2 text-xs sm:text-sm text-black">
              <span className="font-medium">New member?</span>
              <Link to="/" className="text-[#8920AC] hover:text-[#7a1c98] font-bold flex items-center gap-1">
                Register here <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <Card className="border border-muted shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-[#8920AC]">
                  <UserCheck className="h-5 w-5" />
                  Mark Attendance
                </CardTitle>
                <CardDescription>
                  Search for your registered name or phone number below.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Service Type Selection */}
                <div className="space-y-2">
                  <Label htmlFor="service_type" className="text-sm font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#8920AC]" />
                    Select Today's Service
                  </Label>
                  <Select
                    value={serviceType}
                    onValueChange={(value) => setServiceType(value as ServiceType)}
                  >
                    <SelectTrigger className="h-12 border border-muted-foreground/30 rounded-lg text-base text-black focus:border-[#8920AC]/50 shadow-sm focus:ring-2 focus:ring-[#8920AC]/20">
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-muted-foreground/20">
                      <SelectItem value="sunday_service">Sunday Service</SelectItem>
                      <SelectItem value="bible_study">Bible Study</SelectItem>
                      <SelectItem value="revival_hour">Revival Hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Name / Phone Search */}
                <div className="space-y-2">
                  <Label htmlFor="search" className="text-sm font-semibold flex items-center gap-2">
                    <Search className="h-4 w-4 text-[#8920AC]" />
                    Your Name or Phone Number
                  </Label>
                  <div className="relative">
                    <Input
                      id="search"
                      placeholder="e.g. Ayodeji or 080..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-12 border border-muted-foreground/30 rounded-lg pl-4 pr-10 text-base text-black shadow-sm focus:border-[#8920AC]/50 focus:ring-2 focus:ring-[#8920AC]/20 transition-all placeholder:text-gray-400"
                    />
                    {isSearching && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#8920AC] border-t-transparent" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider px-1">
                      Search Results ({searchResults.length})
                    </p>
                    <div className="border border-muted rounded-xl divide-y overflow-hidden max-h-[300px] overflow-y-auto bg-muted/20">
                      {searchResults.map((member) => (
                        <div
                          key={member.id}
                          onClick={() => handleMemberSelect(member)}
                          className="flex items-center justify-between p-3.5 hover:bg-[#8920AC]/5 cursor-pointer transition-colors active:bg-[#8920AC]/10 group"
                        >
                          <div className="flex-grow pr-3">
                            <p className="font-semibold text-black group-hover:text-[#8920AC] transition-colors text-sm sm:text-base">
                              {member.full_name}
                            </p>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                              {member.level_number ? `${member.level_number} Level` : "N/A Level"} • {member.department_name || "N/A Department"}
                            </p>
                          </div>
                          <Button size="sm" className="bg-[#8920AC]/10 hover:bg-[#8920AC] text-[#8920AC] hover:text-white rounded-full text-xs font-semibold px-4 transition-all">
                            Present
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {searchTerm.trim().length >= 2 && searchResults.length === 0 && !isSearching && (
                  <div className="text-center py-8 bg-muted/20 rounded-xl border border-dashed border-muted">
                    <p className="text-muted-foreground text-sm">No registered members found.</p>
                    <p className="text-xs text-muted-foreground/80 mt-1">Check spelling or register as a first-timer below.</p>
                    <Link to="/" className="inline-block mt-3">
                      <Button size="sm" variant="outline" className="text-[#8920AC] hover:text-white hover:bg-[#8920AC] border-[#8920AC]/30 rounded-full text-xs">
                        Register Now
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="max-w-sm sm:max-w-md rounded-2xl bg-background border border-muted">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-bold text-[#8920AC] flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Confirm Attendance
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm text-muted-foreground">
              Are you sure you want to mark yourself present?
            </DialogDescription>
          </DialogHeader>

          {selectedMember && (
            <div className="bg-muted/50 p-4 rounded-xl space-y-2 border border-muted">
              <p className="font-bold text-black text-base">{selectedMember.full_name}</p>
              <div className="text-xs sm:text-sm text-muted-foreground space-y-1">
                <p className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-[#8920AC]" />
                  {selectedMember.level_number ? `${selectedMember.level_number} Level` : "N/A Level"} • {selectedMember.department_name || "N/A Department"}
                </p>
                <p className="flex items-center gap-1.5 pt-1 border-t border-muted mt-2">
                  <Calendar className="h-3.5 w-3.5 text-[#8920AC]" />
                  Service: <span className="font-semibold text-black">{SERVICE_TYPE_LABELS[serviceType]}</span>
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="mt-4 flex flex-row gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setIsConfirmOpen(false)}
              className="flex-1 sm:flex-none rounded-full h-11 text-black"
            >
              Cancel
            </Button>
            <Button
              onClick={handleMarkPresent}
              disabled={isSubmitting}
              className="bg-[#8920AC] hover:bg-[#7a1c98] text-white flex-1 sm:flex-none rounded-full h-11 font-semibold"
            >
              {isSubmitting ? "Submitting..." : "Yes, Mark Present"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-muted-foreground border-t border-muted bg-muted/10">
        <p>© {new Date().getFullYear()} Mountain of Fire and Miracles Ministries Campus Fellowship, FUTA Chapter.</p>
      </footer>
    </div>
  );
};

export default PublicAttendance;
