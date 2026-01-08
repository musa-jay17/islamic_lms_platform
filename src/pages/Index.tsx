import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Dashboard from '@/components/Dashboard';
import { 
  BookOpen, 
  Users, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar,
  Star,
  GraduationCap,
  Heart,
  Globe,
  Award,
  Building,
  Menu,
  X
} from 'lucide-react';

const Index = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showLMS, setShowLMS] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const prayerTimes = [
    { name: 'Fajr', time: '5:32 AM', arabic: 'الفجر' },
    { name: 'Dhuhr', time: '12:16 PM', arabic: 'الظهر' },
    { name: 'Asr', time: '3:01 PM', arabic: 'العصر' },
    { name: 'Maghrib', time: '5:22 PM', arabic: 'المغرب' },
    { name: 'Isha', time: '6:37 PM', arabic: 'العشاء' }
  ];

  const courses = [
    {
      title: 'Quranic Studies',
      description: 'Comprehensive study of the Holy Quran with Tajweed and Tafsir',
      duration: '2 Years',
      level: 'All Levels',
      image: '/images/quran_arabic_4.jpeg'
    },
    {
      title: 'Arabic Language',
      description: 'Classical and Modern Arabic language instruction',
      duration: '1 Year',
      level: 'Beginner to Advanced',
      image: '/images/quran_arabic_1.jpeg'
    },
    {
      title: 'Islamic Jurisprudence (Fiqh)',
      description: 'Study of Islamic law and jurisprudence',
      duration: '3 Years',
      level: 'Intermediate',
      image: '/images/islamic_education_1.jpeg'
    },
    {
      title: 'Hadith Studies',
      description: 'Authentic sayings and traditions of Prophet Muhammad (PBUH)',
      duration: '2 Years',
      level: 'Intermediate',
      image: '/images/islamic_education_2.jpeg'
    },
    {
      title: 'Islamic History',
      description: 'Comprehensive study of Islamic civilization and history',
      duration: '1 Year',
      level: 'All Levels',
      image: '/images/islamic_education_5.jpeg'
    },
    {
      title: 'Aqeedah (Creed)',
      description: 'Fundamental beliefs and theology in Islam',
      duration: '1 Year',
      level: 'All Levels',
      image: '/images/islamic_education_7.jpeg'
    }
  ];

  const faculty = [
    {
      name: 'Shiekh Ahmad Fuad',
      title: 'Professor of Quranic Studies',
      specialization: 'Tafsir and Quranic Sciences',
      education: 'PhD in Islamic Studies, Al-Azhar University'
    },
    {
      name: 'Sheikh Muhammad Al-Habib',
      title: 'Professor of Hadith Sciences',
      specialization: 'Hadith Authentication and Methodology',
      education: 'MA in Hadith Studies, Islamic University of Medina'
    },
    {
      name: 'Dr. Fatima Al-Zahra',
      title: 'Professor of Arabic Literature',
      specialization: 'Classical Arabic Poetry and Rhetoric',
      education: 'PhD in Arabic Literature, Cairo University'
    },
    {
      name: 'Sheikh Abdullah Al-Fiqhi',
      title: 'Professor of Islamic Jurisprudence',
      specialization: 'Comparative Fiqh and Legal Theory',
      education: 'PhD in Islamic Law, University of Damascus'
    }
  ];

  const stats = [
    { number: '500+', label: 'Students Enrolled', icon: Users },
    { number: '25+', label: 'Expert Faculty', icon: GraduationCap },
    { number: '15+', label: 'Years of Excellence', icon: Award },
    { number: '20+', label: 'Countries Represented', icon: Globe }
  ];

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50">
      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-sm shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Building className="h-8 w-8 text-green-600" />
              <span className="text-xl font-bold text-gray-900">Madrasa Al-Hikmah</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#home" className="text-gray-700 hover:text-green-600 transition-colors">Home</a>
              <a href="#about" className="text-gray-700 hover:text-green-600 transition-colors">About</a>
              <a href="#courses" className="text-gray-700 hover:text-green-600 transition-colors">Courses</a>
              <a href="#faculty" className="text-gray-700 hover:text-green-600 transition-colors">Faculty</a>
              <a href="#contact" className="text-gray-700 hover:text-green-600 transition-colors">Contact</a>
              <Button className="bg-green-600 hover:bg-green-700">Apply Now</Button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button variant="ghost" size="sm" onClick={toggleMenu}>
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t">
              <div className="flex flex-col space-y-3">
                <a href="#home" className="text-gray-700 hover:text-green-600 transition-colors px-2 py-1">Home</a>
                <a href="#about" className="text-gray-700 hover:text-green-600 transition-colors px-2 py-1">About</a>
                <a href="#courses" className="text-gray-700 hover:text-green-600 transition-colors px-2 py-1">Courses</a>
                <a href="#faculty" className="text-gray-700 hover:text-green-600 transition-colors px-2 py-1">Faculty</a>
                <a href="#contact" className="text-gray-700 hover:text-green-600 transition-colors px-2 py-1">Contact</a>
                <Button className="bg-green-600 hover:bg-green-700 mx-2 mt-2">Apply Now</Button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 islamic-pattern opacity-30"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
                Madrasa Al-Hikmah
                <span className="block text-green-600 calligraphy-accent">Islamic Learning Institute</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Dedicated to authentic Islamic education, fostering spiritual growth, and nurturing scholars 
                who will serve the Muslim Ummah with knowledge, wisdom, and righteousness.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button size="lg" className="bg-green-600 hover:bg-green-700 mosque-shadow" onClick={() => setShowLMS(true)}>
                  <BookOpen className="mr-2 h-5 w-5" />
                  Access LMS Portal
                </Button>
                <Button size="lg" variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                  <Users className="mr-2 h-5 w-5" />
                  Join Our Community
                </Button>
              </div>
            </div>
            <div className="relative">
              <img 
                src="/images/islamic_education_3.webp" 
                alt="Islamic Learning" 
                className="rounded-2xl shadow-2xl w-full h-auto"
              />
              <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-xl shadow-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">15+</div>
                  <div className="text-sm text-gray-600">Years of Excellence</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Prayer Times Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Today's Prayer Times</h2>
            <div className="section-divider"></div>
            <p className="text-gray-600 mt-4">Current time: {currentTime.toLocaleTimeString()}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {prayerTimes.map((prayer, index) => (
              <Card key={index} className="prayer-time-card text-center">
                <CardContent className="p-4">
                  <div className="arabic-text text-lg font-semibold text-green-600 mb-1">
                    {prayer.arabic}
                  </div>
                  <div className="font-medium text-gray-900">{prayer.name}</div>
                  <div className="text-sm text-gray-600">{prayer.time}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 hero-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center text-white">
                <stat.icon className="h-12 w-12 mx-auto mb-4 opacity-90" />
                <div className="text-3xl lg:text-4xl font-bold mb-2">{stat.number}</div>
                <div className="text-green-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                Our Mission & Vision
              </h2>
              <div className="section-divider mb-6"></div>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-green-600 mb-3 flex items-center">
                    <Heart className="mr-2 h-5 w-5" />
                    Our Mission
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    To provide authentic Islamic education rooted in the Quran and Sunnah, 
                    fostering spiritual growth, academic excellence, and moral character development 
                    for students to become righteous leaders and scholars serving the Muslim Ummah.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-green-600 mb-3 flex items-center">
                    <Star className="mr-2 h-5 w-5" />
                    Our Vision
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    To be a leading center of Islamic learning that bridges traditional scholarship 
                    with contemporary needs, producing graduates who are well-versed in Islamic 
                    sciences and equipped to address modern challenges with Islamic wisdom.
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <img 
                src="/images/islamic_education_1.jpeg" 
                alt="Islamic Education" 
                className="rounded-lg shadow-lg"
              />
              <img 
                src="/images/islamic_education_2.jpeg" 
                alt="Students Learning" 
                className="rounded-lg shadow-lg mt-8"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section id="courses" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Our Academic Programs
            </h2>
            <div className="section-divider mb-6"></div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive Islamic education programs designed to nurture both spiritual and intellectual growth
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 mosque-shadow">
                <div className="aspect-video overflow-hidden rounded-t-lg">
                  <img 
                    src={course.image} 
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardHeader>
                  <CardTitle className="text-xl text-gray-900">{course.title}</CardTitle>
                  <CardDescription className="text-gray-600">
                    {course.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-4">
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      <Clock className="mr-1 h-3 w-3" />
                      {course.duration}
                    </Badge>
                    <Badge variant="outline" className="border-green-200 text-green-600">
                      {course.level}
                    </Badge>
                  </div>
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    Learn More
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Faculty Section */}
      <section id="faculty" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Our Distinguished Faculty
            </h2>
            <div className="section-divider mb-6"></div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Learn from renowned scholars and experts in Islamic sciences
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {faculty.map((member, index) => (
              <Card key={index} className="text-center group hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <GraduationCap className="h-12 w-12 text-white" />
                  </div>
                  <CardTitle className="text-lg">{member.name}</CardTitle>
                  <CardDescription className="text-green-600 font-medium">
                    {member.title}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-2">{member.specialization}</p>
                  <p className="text-xs text-gray-500">{member.education}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Get in Touch
            </h2>
            <div className="section-divider mb-6"></div>
            <p className="text-xl text-gray-600">
              We welcome inquiries about our programs and admissions
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">Contact Information</h3>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <MapPin className="h-6 w-6 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-medium text-gray-900">Address</h4>
                    <p className="text-gray-600">123 Islamic Center Drive<br />Knowledge City, KC 12345</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <Phone className="h-6 w-6 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-medium text-gray-900">Phone</h4>
                    <p className="text-gray-600">+1 (555) 123-4567</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <Mail className="h-6 w-6 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-medium text-gray-900">Email</h4>
                    <p className="text-gray-600">info@madrasalhikmah.edu</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <Calendar className="h-6 w-6 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-medium text-gray-900">Office Hours</h4>
                    <p className="text-gray-600">Monday - Friday: 9:00 AM - 5:00 PM<br />Saturday: 10:00 AM - 2:00 PM</p>
                  </div>
                </div>
              </div>
            </div>
            
            <Card className="mosque-shadow">
              <CardHeader>
                <CardTitle>Send us a Message</CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you soon
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      <input 
                        type="text" 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Your first name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <input 
                        type="text" 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Your last name"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input 
                      type="email" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="your.email@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="What is this regarding?"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                    <textarea 
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Your message here..."
                    ></textarea>
                  </div>
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <Building className="h-8 w-8 text-green-400" />
                <span className="text-xl font-bold">Madrasa Al-Hikmah</span>
              </div>
              <p className="text-gray-400 text-sm">
                Dedicated to authentic Islamic education and spiritual development, 
                serving the Muslim community with excellence and integrity.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#about" className="text-gray-400 hover:text-green-400 transition-colors">About Us</a></li>
                <li><a href="#courses" className="text-gray-400 hover:text-green-400 transition-colors">Courses</a></li>
                <li><a href="#faculty" className="text-gray-400 hover:text-green-400 transition-colors">Faculty</a></li>
                <li><a href="#contact" className="text-gray-400 hover:text-green-400 transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Programs</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-400 hover:text-green-400 transition-colors">Quranic Studies</a></li>
                <li><a href="#" className="text-gray-400 hover:text-green-400 transition-colors">Arabic Language</a></li>
                <li><a href="#" className="text-gray-400 hover:text-green-400 transition-colors">Islamic Jurisprudence</a></li>
                <li><a href="#" className="text-gray-400 hover:text-green-400 transition-colors">Hadith Studies</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Connect With Us</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <p>123 Islamic Center Drive</p>
                <p>Knowledge City, KC 12345</p>
                <p>Phone: +1 (555) 123-4567</p>
                <p>Email: info@madrasalhikmah.edu</p>
              </div>
            </div>
          </div>
          
          <Separator className="my-8 bg-gray-700" />
          
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
            <p>&copy; 2024 Madrasa Al-Hikmah. All rights reserved.</p>
            <p className="mt-2 md:mt-0">
              <span className="arabic-text text-green-400">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم</span>
            </p>
          </div>
        </div>
      </footer>
      
      {/* LMS Portal Modal */}
      {showLMS && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold">Learning Management System</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowLMS(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="h-full overflow-auto">
              <Dashboard />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;