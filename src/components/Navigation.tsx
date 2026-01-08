import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { 
  GraduationCap, 
  Menu, 
  X, 
  User, 
  LogOut,
  BookOpen,
  Users,
  Settings,
  BarChart3
} from 'lucide-react';

interface NavigationProps {
  user: any;
  profile: any;
}

const Navigation = ({ user, profile }: NavigationProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Signed out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  const getDashboardLink = () => {
    if (!profile) return '/';
    switch (profile.role) {
      case 'admin': return '/admin';
      case 'instructor': return '/instructor';
      case 'student': return '/student';
      default: return '/';
    }
  };

  return (
    <nav className="bg-white/95 backdrop-blur-sm shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <GraduationCap className="h-8 w-8 text-green-600" />
            <span className="text-xl font-bold text-gray-900">Madrasa Al-Hikmah</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-gray-700 hover:text-green-600 transition-colors">
              Home
            </Link>
            <Link to="/enrollment" className="text-gray-700 hover:text-green-600 transition-colors">
              Enrollment
            </Link>
            
            {user ? (
              <>
                <Link 
                  to={getDashboardLink()} 
                  className="text-gray-700 hover:text-green-600 transition-colors flex items-center"
                >
                  {profile?.role === 'admin' && <Settings className="h-4 w-4 mr-1" />}
                  {profile?.role === 'instructor' && <BookOpen className="h-4 w-4 mr-1" />}
                  {profile?.role === 'student' && <User className="h-4 w-4 mr-1" />}
                  Dashboard
                </Link>
                
                {profile?.role === 'admin' && (
                  <Link to="/admin" className="text-gray-700 hover:text-green-600 transition-colors flex items-center">
                    <BarChart3 className="h-4 w-4 mr-1" />
                    Admin
                  </Link>
                )}
                
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">
                    {profile?.full_name || user.email}
                  </span>
                  <Button variant="outline" size="sm" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </>
            ) : (
              <Button className="bg-green-600 hover:bg-green-700">
                Sign In
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button variant="ghost" size="sm" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-3">
              <Link 
                to="/" 
                className="text-gray-700 hover:text-green-600 transition-colors px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                to="/enrollment" 
                className="text-gray-700 hover:text-green-600 transition-colors px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                Enrollment
              </Link>
              
              {user ? (
                <>
                  <Link 
                    to={getDashboardLink()} 
                    className="text-gray-700 hover:text-green-600 transition-colors px-2 py-1"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      handleSignOut();
                      setIsMenuOpen(false);
                    }}
                    className="mx-2 mt-2"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button className="bg-green-600 hover:bg-green-700 mx-2 mt-2">
                  Sign In
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;