import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import heroBackground from "@/assets/fellowship-background.jpg";
import mfmLogo from "@/assets/mfm-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { User, GraduationCap } from "lucide-react";
import { SuccessDialog } from "@/components/SuccessDialog";

interface Department {
  id: string;
  name: string;
}

interface Level {
  id: string;
  level_number: string;
}

const registrationSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .regex(
      /^[a-zA-Z\s'-]+$/,
      "Name can only contain letters, spaces, hyphens, and apostrophes"
    ),
  phoneNumber: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .regex(
      /^(\+?234|0)[789]\d{9}$/,
      "Please enter a valid Nigerian phone number"
    ),
  address: z
    .string()
    .trim()
    .max(200, "Address must be less than 200 characters")
    .optional(),
  birthMonth: z.string().min(1, "Please select birth month"),
  birthDay: z.string().min(1, "Please select birth day"),
  gender: z.string().optional(),
  levelId: z.string().min(1, "Please select a level"),
  departmentId: z.string().min(1, "Please select a department"),
  departmentOther: z
    .string()
    .trim()
    .max(100, "Department name must be less than 100 characters")
    .optional(),
  howDidYouHear: z
    .string()
    .trim()
    .max(200, "Response must be less than 200 characters")
    .optional(),
});

const Index = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [showOtherDepartment, setShowOtherDepartment] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    address: "",
    birthMonth: "",
    birthDay: "",
    gender: "",
    levelId: "",
    departmentId: "",
    departmentOther: "",
    howDidYouHear: "",
  });

  useEffect(() => {
    const loadDepartmentsAndLevels = async () => {
      const { data: deptData } = await supabase
        .from("departments")
        .select("id, name")
        .order("name");

      const { data: levelData } = await supabase
        .from("levels")
        .select("id, level_number")
        .order("level_number");

      if (deptData) setDepartments(deptData);
      if (levelData) setLevels(levelData);
    };

    loadDepartmentsAndLevels();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form data
    try {
      registrationSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    setIsSubmitting(true);

    // Sanitize inputs and create a date with current year
    const currentYear = new Date().getFullYear();
    const dateOfBirth = `${currentYear}-${formData.birthMonth.padStart(
      2,
      "0"
    )}-${formData.birthDay.padStart(2, "0")}`;

    const sanitizedData = {
      fullName: formData.fullName.trim(),
      phoneNumber: formData.phoneNumber
        ? formData.phoneNumber.trim().replace(/\s+/g, "")
        : null,
      address: formData.address.trim() || null,
      dateOfBirth: dateOfBirth,
      gender: formData.gender || null,
      levelId: formData.levelId,
      departmentId: formData.departmentId,
      departmentOther: formData.departmentOther.trim() || null,
      howDidYouHear: formData.howDidYouHear.trim() || null,
      isFirstTimer: true,
    };

    // Register via edge function (handles department creation and member insertion)
    const { data, error } = await supabase.functions.invoke('register-member', {
      body: sanitizedData,
    });

    setIsSubmitting(false);

    if (error || data?.error) {
      const errorMessage = error?.message || data?.error || 'An error occurred';
      
      // Check for duplicate phone number
      if (errorMessage.includes('already registered') || data?.error?.includes('already registered')) {
        toast({
          title: "Already Registered",
          description: "This phone number has already been registered.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Submission Failed",
          description: "There was an error submitting your registration. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      // Show success dialog
      setShowSuccessDialog(true);

      // Reload departments to include any newly created ones
      const { data: deptData } = await supabase
        .from("departments")
        .select("id, name")
        .order("name");
      if (deptData) setDepartments(deptData);

      // Reset form
      setFormData({
        fullName: "",
        phoneNumber: "",
        address: "",
        birthMonth: "",
        birthDay: "",
        gender: "",
        levelId: "",
        departmentId: "",
        departmentOther: "",
        howDidYouHear: "",
      });
      setShowOtherDepartment(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div
        className="relative h-[35vh] sm:h-[50vh] min-h-[240px] sm:min-h-[400px] bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBackground})` }}
      >
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
          <img
            src={mfmLogo}
            alt="MFM CF Logo"
            className="w-20 h-20 sm:w-24 sm:h-24 mb-4 sm:mb-6 bg-white rounded-full p-2"
          />
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white mb-1 sm:mb-2">
            MFMCF FUTA CHAPTER
          </h1>
          <p className="text-xl sm:text-2xl md:text-3xl font-semibold text-[#8920AC]">
            {" "}
            First Timer Registration
          </p>
        </div>
      </div>

      {/* Form Section */}
      <div className="max-w-md sm:max-w-3xl mx-auto px-4 py-6 sm:px-12 sm:py-12">
        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          {/* Personal Details Section */}
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2 text-black">
              <User className="w-5 h-5 text-black" />
              Personal Details
            </h2>

            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="fullName" className="hidden sm:block text-base">
                Full Name
              </Label>
              <Input
                id="fullName"
                required
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                placeholder="Full Name"
                className="h-12 sm:h-14 border border-muted-foreground/30 rounded-lg text-base text-black placeholder:text-gray-400 shadow-sm focus:border-[#8920AC]/50 focus:ring-2 focus:ring-[#8920AC]/20 transition-all"
              />
            </div>

            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="gender" className="hidden sm:block text-base">
                Gender
              </Label>
              <Select
                value={formData.gender}
                onValueChange={(value) =>
                  setFormData({ ...formData, gender: value })
                }
              >
                <SelectTrigger className="h-12 sm:h-14 border border-muted-foreground/30 rounded-lg text-base text-black placeholder:text-gray-400 shadow-sm focus:border-[#8920AC]/50 focus:ring-2 focus:ring-[#8920AC]/20 transition-all">
                  <SelectValue placeholder="Gender" className="text-gray-400" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-muted-foreground/20">
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 sm:space-y-2">
                <Label
                  htmlFor="birthMonth"
                  className="hidden sm:block text-base"
                >
                  Birth Month
                </Label>
                <Select
                  required
                  value={formData.birthMonth}
                  onValueChange={(value) =>
                    setFormData({ ...formData, birthMonth: value })
                  }
                >
                  <SelectTrigger className="h-12 sm:h-14 border border-muted-foreground/30 rounded-lg text-base text-black placeholder:text-gray-400 shadow-sm focus:border-[#8920AC]/50 focus:ring-2 focus:ring-[#8920AC]/20 transition-all">
                    <SelectValue
                      placeholder="Birth Month"
                      className="text-gray-400"
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-muted-foreground/20 max-h-[300px]">
                    <SelectItem value="1">January</SelectItem>
                    <SelectItem value="2">February</SelectItem>
                    <SelectItem value="3">March</SelectItem>
                    <SelectItem value="4">April</SelectItem>
                    <SelectItem value="5">May</SelectItem>
                    <SelectItem value="6">June</SelectItem>
                    <SelectItem value="7">July</SelectItem>
                    <SelectItem value="8">August</SelectItem>
                    <SelectItem value="9">September</SelectItem>
                    <SelectItem value="10">October</SelectItem>
                    <SelectItem value="11">November</SelectItem>
                    <SelectItem value="12">December</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="birthDay" className="hidden sm:block text-base">
                  Birth Day
                </Label>
                <Select
                  required
                  value={formData.birthDay}
                  onValueChange={(value) =>
                    setFormData({ ...formData, birthDay: value })
                  }
                >
                  <SelectTrigger className="h-12 sm:h-14 border border-muted-foreground/30 rounded-lg text-base text-black placeholder:text-gray-400 shadow-sm focus:border-[#8920AC]/50 focus:ring-2 focus:ring-[#8920AC]/20 transition-all">
                    <SelectValue
                      placeholder="Birth Day"
                      className="text-gray-400"
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-muted-foreground/20 max-h-[300px]">
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <SelectItem key={day} value={day.toString()}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1 sm:space-y-2">
              <Label
                htmlFor="phoneNumber"
                className="hidden sm:block text-base text-gray-500"
              >
                Phone Number 
              </Label>
              <Input
                id="phoneNumber"
                required
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) =>
                  setFormData({ ...formData, phoneNumber: e.target.value })
                }
                placeholder="Phone Number"
                className="h-12 sm:h-14 border border-muted-foreground/30 rounded-lg text-base text-black placeholder:text-gray-400 shadow-sm focus:border-[#8920AC]/50 focus:ring-2 focus:ring-[#8920AC]/20 transition-all"
              />
            </div>

            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="address" className="hidden sm:block text-base">
                Address
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="Address"
                className="h-12 sm:h-14 border border-muted-foreground/30 rounded-lg text-base text-black placeholder:text-gray-400 shadow-sm focus:border-[#8920AC]/50 focus:ring-2 focus:ring-[#8920AC]/20 transition-all"
              />
            </div>
          </div>

          {/* Academic Information Section */}
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2 text-black">
              <GraduationCap className="w-5 h-5 text-black" />
              Academic Information
            </h2>

            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="department" className="hidden sm:block text-base">
                Department
              </Label>
              <Select
                required
                value={formData.departmentId}
                onValueChange={(value) => {
                  setFormData({ ...formData, departmentId: value });
                  setShowOtherDepartment(value === "other");
                }}
              >
                <SelectTrigger className="h-12 sm:h-14 border border-muted-foreground/30 rounded-lg text-base text-black placeholder:text-gray-400 shadow-sm focus:border-[#8920AC]/50 focus:ring-2 focus:ring-[#8920AC]/20 transition-all">
                  <SelectValue
                    placeholder="Department"
                    className="text-gray-400"
                  />
                </SelectTrigger>
                <SelectContent className="bg-background border border-muted-foreground/20 max-h-[300px]">
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="other">Other (Please specify)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {showOtherDepartment && (
              <div className="space-y-1 sm:space-y-2">
                <Label
                  htmlFor="departmentOther"
                  className="hidden sm:block text-base"
                >
                  Specify Department
                </Label>
                <Input
                  id="departmentOther"
                  required
                  value={formData.departmentOther}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      departmentOther: e.target.value,
                    })
                  }
                  placeholder="Enter your department"
                  className="h-12 sm:h-14 border border-muted-foreground/30 rounded-lg text-base text-black placeholder:text-gray-400 shadow-sm focus:border-[#8920AC]/50 focus:ring-2 focus:ring-[#8920AC]/20 transition-all"
                />
              </div>
            )}

            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="level" className="hidden sm:block text-base">
                Level
              </Label>
              <Select
                required
                value={formData.levelId}
                onValueChange={(value) =>
                  setFormData({ ...formData, levelId: value })
                }
              >
                <SelectTrigger className="h-12 sm:h-14 border border-muted-foreground/30 rounded-lg text-base text-black placeholder:text-gray-400 shadow-sm focus:border-[#8920AC]/50 focus:ring-2 focus:ring-[#8920AC]/20 transition-all">
                  <SelectValue placeholder="Level" className="text-gray-400" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-muted-foreground/20">
                  {levels.map((level) => (
                    <SelectItem key={level.id} value={level.id}>
                      {level.level_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 sm:space-y-2">
              <Label
                htmlFor="howDidYouHear"
                className="hidden sm:block text-base"
              >
                How did you hear about us?
              </Label>
              <Input
                id="howDidYouHear"
                value={formData.howDidYouHear}
                onChange={(e) =>
                  setFormData({ ...formData, howDidYouHear: e.target.value })
                }
                placeholder="How did you hear about us?"
                className="h-12 sm:h-14 border border-muted-foreground/30 rounded-lg text-base text-black placeholder:text-gray-400 shadow-sm focus:border-[#8920AC]/50 focus:ring-2 focus:ring-[#8920AC]/20 transition-all"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-14 text-base sm:text-lg bg-[#8920AC] hover:bg-[#7a1c98] text-white rounded-full font-semibold shadow-lg mt-6"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </form>
      </div>

      <SuccessDialog 
        open={showSuccessDialog} 
        onOpenChange={setShowSuccessDialog}
      />
    </div>
  );
};

export default Index;
