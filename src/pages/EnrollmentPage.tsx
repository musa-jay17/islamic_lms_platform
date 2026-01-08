import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

import { BookOpen, CheckCircle, User, Clock, Award } from "lucide-react";

type Level = "beginner" | "intermediate" | "advanced";

const EnrollmentPage = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [user, setUser] = useState<any>(null);

  // ✅ Level-only selection
  const [selectedLevel, setSelectedLevel] = useState<Level | "">("");

  // Keep all your questions
  const [formData, setFormData] = useState<any>({
    // Personal Information
    firstName: "",
    otherNames: "",
    surname: "",
    mothersName: "",
    fathersName: "",
    nationality: "",
    gender: "",
    maritalStatus: "",
    occupation: "",
    contactNumber1: "+232",
    contactNumber2: "+232",
    contactAddress: "",
    age: "",
    email: "",

    // Educational Information
    islamicEducationLevel: "",
    islamicSchoolType: "",
    englishEducationLevel: "",
    schoolAttended: "",

    // Religious Enquiry (Male)
    lengthensBeard: "",
    wearsTrousersAboveAnkle: "",
    observesDailyPrayers: "",
    islamicHairstyle: "",
    observesSunnahFasting: "",

    // Religious Enquiry (Female)
    isHijabi: "",
    isNiqabi: "",
    wearsWig: "",
    observesDailyPrayersFemale: "",
    observesSunnahFastingFemale: "",

    // Declaration
    agreeToTerms: false,
  });

  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        setUser(data.user || null);

        if (data.user?.email) {
          setFormData((prev: any) => ({ ...prev, email: data.user.email }));
        }
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const fullName = useMemo(() => {
    return `${formData.firstName} ${formData.otherNames} ${formData.surname}`.replace(/\s+/g, " ").trim();
  }, [formData.firstName, formData.otherNames, formData.surname]);

  const levelLabel = (lvl: Level | "") => {
    if (!lvl) return "SELECT LEVEL";
    if (lvl === "beginner") return "BEGINNER";
    if (lvl === "intermediate") return "INTERMEDIATE";
    return "ADVANCED";
  };

  const validate = () => {
    if (!selectedLevel) {
      toast.error("Please select a level (Beginner / Intermediate / Advanced)");
      return false;
    }
    if (!formData.agreeToTerms) {
      toast.error("Please agree to the declaration terms");
      return false;
    }
    if (!formData.firstName || !formData.surname || !formData.gender) {
      toast.error("Please fill in all required fields (First Name, Surname, Gender)");
      return false;
    }
    if (!formData.email) {
      toast.error("Email is required");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        student_id: user?.id ?? null,
        email: String(formData.email).toLowerCase().trim(),
        full_name: fullName,
        requested_level: selectedLevel,
        status: "pending",
        form_data: {
          ...formData,
          requestedLevel: selectedLevel,
          submittedFrom: "EnrollmentPage",
        },
      };

      const { error } = await supabase
        .from("enrollment_applications_2025_11_15_16_09")
        .insert(payload);

      if (error) throw error;

      toast.success("Application submitted! Admin will approve/deny your enrollment.");
      navigate("/dashboard"); // or navigate("/thank-you")
    } catch (err: any) {
      console.error(err);
      toast.error("Submission failed: " + (err?.message || "Unknown error"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading enrollment form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header (matches your image vibe) */}
        <div className="text-center mb-10">
          <div className="bg-green-600 text-white p-6 rounded-lg mb-4">
            <h1 className="text-3xl font-bold mb-1">LEARN ABOUT ISLAM INSTITUTION</h1>
            <p className="text-base font-semibold">KNOWLEDGE IS OUR PRIORITY</p>
            <div className="mt-3">
              <span className="arabic-text text-2xl">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم</span>
            </div>
          </div>

          <div className="bg-white border-2 border-green-600 p-4 rounded-lg">
            <h2 className="text-2xl font-bold text-green-600 mb-2">
              APPLICATION FORM FOR 2024–2025 ACADEMIC YEAR
            </h2>
            <Badge className="bg-yellow-500 text-black text-lg px-4 py-2">
              {levelLabel(selectedLevel as any)}
            </Badge>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600 mt-5">
            <div>
              <p><strong>Contact Numbers:</strong> +232772644859, +23288504559, +23288140649</p>
              <p><strong>Email:</strong> learnaboutislamiorg@gmail.com</p>
            </div>
            <div>
              <p><strong>Website:</strong> www.learnaboutislamorg.weds.com</p>
              <p><strong>Facebook:</strong> Learn about Islam</p>
              <p><strong>Address:</strong> UMASS School, Sumaila Town, Model New Road</p>
            </div>
          </div>
        </div>

        {/* ✅ Level Selection ONLY */}
        <Card className="mb-8 border-2 border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="mr-2 h-5 w-5" />
              Program Level Selection
            </CardTitle>
            <CardDescription>
              Select the level you want to apply for. Admin will approve/deny your application.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 max-w-sm">
              <Label>Choose Level *</Label>
              <Select value={selectedLevel} onValueChange={(v: any) => setSelectedLevel(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-xs text-gray-500 mt-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Duration depends on curriculum
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Credits depend on admin assignment
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Application Form */}
        <Card className="border-2 border-green-600">
          <CardHeader className="bg-green-50">
            <CardTitle className="flex items-center text-green-700">
              <User className="mr-2 h-5 w-5" />
              PERSONAL INFORMATION
            </CardTitle>
            <CardDescription>
              Please fill out all sections accurately. A passport photograph is required.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Passport placeholder */}
              <div className="flex justify-end">
                <div className="w-32 h-40 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-500 text-sm text-center">
                  Passport<br />Picture Here
                </div>
              </div>

              {/* PERSONAL INFORMATION */}
              <div className="border-2 border-gray-200 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-green-700 mb-4 border-b pb-2">
                  PERSONAL INFORMATION
                </h3>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="otherNames">Other Name(s)</Label>
                    <Input
                      id="otherNames"
                      value={formData.otherNames}
                      onChange={(e) => handleInputChange("otherNames", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="surname">Surname *</Label>
                    <Input
                      id="surname"
                      value={formData.surname}
                      onChange={(e) => handleInputChange("surname", e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="mothersName">Mother’s Name</Label>
                    <Input
                      id="mothersName"
                      value={formData.mothersName}
                      onChange={(e) => handleInputChange("mothersName", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="fathersName">Father’s Name</Label>
                    <Input
                      id="fathersName"
                      value={formData.fathersName}
                      onChange={(e) => handleInputChange("fathersName", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="nationality">Nationality</Label>
                    <Input
                      id="nationality"
                      value={formData.nationality}
                      onChange={(e) => handleInputChange("nationality", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="gender">Gender *</Label>
                    <Select value={formData.gender} onValueChange={(v) => handleInputChange("gender", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="maritalStatus">Marital Status</Label>
                    <Select value={formData.maritalStatus} onValueChange={(v) => handleInputChange("maritalStatus", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="married">Married</SelectItem>
                        <SelectItem value="divorced">Divorced</SelectItem>
                        <SelectItem value="widowed">Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="occupation">Occupation</Label>
                    <Input
                      id="occupation"
                      value={formData.occupation}
                      onChange={(e) => handleInputChange("occupation", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="contactNumber1">Contact Number(s) *</Label>
                    <Input
                      id="contactNumber1"
                      value={formData.contactNumber1}
                      onChange={(e) => handleInputChange("contactNumber1", e.target.value)}
                      required
                    />
                    <div className="mt-2">
                      <Input
                        id="contactNumber2"
                        value={formData.contactNumber2}
                        onChange={(e) => handleInputChange("contactNumber2", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="contactAddress">Contact Address</Label>
                    <Textarea
                      id="contactAddress"
                      value={formData.contactAddress}
                      onChange={(e) => handleInputChange("contactAddress", e.target.value)}
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      value={formData.age}
                      onChange={(e) => handleInputChange("age", e.target.value)}
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    required
                    disabled={!!user}
                  />
                </div>
              </div>

              {/* EDUCATIONAL INFORMATION (kept) */}
              <div className="border-2 border-gray-200 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-green-700 mb-4 border-b pb-2">
                  EDUCATIONAL INFORMATION
                </h3>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="border p-4 rounded-lg">
                    <h4 className="font-semibold mb-3">Islamic Education</h4>

                    <Label className="text-sm">Level of Islamic Education</Label>
                    <Select value={formData.islamicEducationLevel} onValueChange={(v) => handleInputChange("islamicEducationLevel", v)}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weak">Weak</SelectItem>
                        <SelectItem value="average">Average</SelectItem>
                        <SelectItem value="better">Better</SelectItem>
                        <SelectItem value="very_strong">Very Strong</SelectItem>
                      </SelectContent>
                    </Select>

                    <Label className="text-sm mt-4">Type of Islamic School Attended/Attending</Label>
                    <Select value={formData.islamicSchoolType} onValueChange={(v) => handleInputChange("islamicSchoolType", v)}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="institution">Institution</SelectItem>
                        <SelectItem value="masjid_school">Masjid School</SelectItem>
                        <SelectItem value="karaneth">Karaneth</SelectItem>
                        <SelectItem value="self">Self</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="border p-4 rounded-lg">
                    <h4 className="font-semibold mb-3">English Education</h4>

                    <Label className="text-sm">Level of English Education</Label>
                    <Select value={formData.englishEducationLevel} onValueChange={(v) => handleInputChange("englishEducationLevel", v)}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="university_college">University/College</SelectItem>
                        <SelectItem value="secondary">Secondary</SelectItem>
                        <SelectItem value="primary">Primary</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>

                    <Label className="text-sm mt-4">State your College/School Attended/Attending</Label>
                    <Input
                      className="mt-2"
                      value={formData.schoolAttended}
                      onChange={(e) => handleInputChange("schoolAttended", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* RELIGIOUS ENQUIRY (kept) */}
              <div className="border-2 border-gray-200 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-green-700 mb-4 border-b pb-2">
                  RELIGIOUS ENQUIRY
                </h3>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Male */}
                  <div className="border p-4 rounded-lg">
                    <h4 className="font-semibold mb-3">Only for Male (Brothers tick any box)</h4>

                    <YesNoRow
                      label="Do you lengthen your Beard?"
                      value={formData.lengthensBeard}
                      onChange={(v) => handleInputChange("lengthensBeard", v)}
                    />
                    <YesNoRow
                      label="Do you wear Trousers above ankle?"
                      value={formData.wearsTrousersAboveAnkle}
                      onChange={(v) => handleInputChange("wearsTrousersAboveAnkle", v)}
                    />
                    <YesNoRow
                      label="Do you observe 5 times daily prayers?"
                      value={formData.observesDailyPrayers}
                      onChange={(v) => handleInputChange("observesDailyPrayers", v)}
                    />
                    <YesNoRow
                      label="Does your hairstyle conform to Islam?"
                      value={formData.islamicHairstyle}
                      onChange={(v) => handleInputChange("islamicHairstyle", v)}
                    />
                    <YesNoRow
                      label="Do you observe Sunnah fasting?"
                      value={formData.observesSunnahFasting}
                      onChange={(v) => handleInputChange("observesSunnahFasting", v)}
                    />
                  </div>

                  {/* Female */}
                  <div className="border p-4 rounded-lg">
                    <h4 className="font-semibold mb-3">Only for Female (Sisters tick any box)</h4>

                    <YesNoRow
                      label="Are you a Hijabi?"
                      value={formData.isHijabi}
                      onChange={(v) => handleInputChange("isHijabi", v)}
                    />
                    <YesNoRow
                      label="Are you a Niqabi?"
                      value={formData.isNiqabi}
                      onChange={(v) => handleInputChange("isNiqabi", v)}
                    />
                    <YesNoRow
                      label="Do you put on wig (Artificial hair)?"
                      value={formData.wearsWig}
                      onChange={(v) => handleInputChange("wearsWig", v)}
                    />
                    <YesNoRow
                      label="Do you observe 5 times daily prayers?"
                      value={formData.observesDailyPrayersFemale}
                      onChange={(v) => handleInputChange("observesDailyPrayersFemale", v)}
                    />
                    <YesNoRow
                      label="Do you observe Sunnah fasting?"
                      value={formData.observesSunnahFastingFemale}
                      onChange={(v) => handleInputChange("observesSunnahFastingFemale", v)}
                    />
                  </div>
                </div>
              </div>

              {/* DECLARATION */}
              <div className="border-2 border-green-600 p-6 rounded-lg bg-green-50">
                <h3 className="text-lg font-semibold text-green-700 mb-4 border-b border-green-300 pb-2">
                  DECLARATION
                </h3>

                <p className="text-gray-700 leading-relaxed">
                  I do confirm that all the information I have written about myself is correct and will abide by all
                  rules and regulations of Learn about Islam Institution (LAI).
                </p>

                <div className="flex items-center space-x-2 mt-4">
                  <Checkbox
                    id="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onCheckedChange={(checked) => handleInputChange("agreeToTerms", !!checked)}
                  />
                  <Label htmlFor="agreeToTerms" className="text-sm font-medium">
                    I agree to the above declaration and terms *
                  </Label>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-4 text-sm text-gray-600">
                  <div>Signature: __________________</div>
                  <div>Date: {new Date().toLocaleDateString()}</div>
                </div>
              </div>

              {/* SUBMIT */}
              <div className="flex justify-center pt-2">
                <Button
                  type="submit"
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 px-12"
                  disabled={submitting || !selectedLevel || !formData.agreeToTerms}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-5 w-5" />
                      Submit Application
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-600">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <p className="text-green-700 font-medium mb-2">Learn About Islam Institution - Knowledge is Our Priority</p>
            <p className="text-sm text-gray-600">
              For inquiries: +232772644859, +23288504559, +23288140649 <br />
              Email: learnaboutislamiorg@gmail.com | Facebook: Learn about Islam
            </p>
          </div>

          <p className="arabic-text text-green-600 text-xl">وَقُل رَّبِّ زِدْنِي عِلْمًا</p>
          <p className="text-sm italic text-gray-600 mt-2">
            "And say: My Lord, increase me in knowledge." (Quran 20:114)
          </p>
        </div>
      </div>
    </div>
  );
};

function YesNoRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: "yes" | "no" | "") => void;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-b-0">
      <span className="text-sm text-gray-700">{label}</span>
      <div className="flex gap-2">
        <Button
          type="button"
          variant={value === "yes" ? "default" : "outline"}
          size="sm"
          onClick={() => onChange("yes")}
        >
          YES
        </Button>
        <Button
          type="button"
          variant={value === "no" ? "default" : "outline"}
          size="sm"
          onClick={() => onChange("no")}
        >
          NO
        </Button>
        <Button
          type="button"
          variant={value === "" ? "secondary" : "outline"}
          size="sm"
          onClick={() => onChange("")}
        >
          —
        </Button>
      </div>
    </div>
  );
}

export default EnrollmentPage;
