import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Button } from './components/ui/button';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { PassageCreator } from './components/admin/PassageCreator';
import { PassageCreatorNew } from './components/admin/PassageCreatorNew';
import { PassageLibrary } from './pages/admin/PassageLibrary';
import { TestBuilder } from './pages/admin/TestBuilder';
import { TestDetail } from './pages/admin/TestDetail';
import { PassageEdit } from './pages/admin/PassageEdit';
import { TestInterface } from './components/student/TestInterface';
import { TakeTestPage } from './pages/student/TakeTestPage';
import { PassagePreviewDemo } from './pages/admin/PassagePreviewDemo';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { AuthInitializer, ProtectedRoute } from './components/auth';
import { ClassManagement } from './pages/admin/ClassManagement';
import { ClassDetail } from './pages/admin/ClassDetail';
import { SessionManagement } from './pages/admin/SessionManagement';
import { SessionMonitoring } from './pages/admin/SessionMonitoring';
import { MySessions } from './pages/student/MySessions';
import { SessionWaitingRoom } from './pages/student/SessionWaitingRoom';
import { SessionTestInterface } from './pages/student/SessionTestInterface';
import { SessionResults } from './pages/student/SessionResults';
import { useAuthStore } from './lib/stores/authStore';
import { UserRole } from './lib/types/auth';
import { LogOut, Shield, GraduationCap, BookOpen } from 'lucide-react';

function HomePage() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">IE</span>
              </div>
              <span className="font-semibold text-white">IELTS Practice</span>
            </div>
            
            <div className="flex items-center gap-3">
              {isAuthenticated && user ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700">
                    {user.role === UserRole.ADMIN ? (
                      <Shield className="w-4 h-4 text-amber-400" />
                    ) : user.role === UserRole.TEACHER ? (
                      <BookOpen className="w-4 h-4 text-blue-400" />
                    ) : (
                      <GraduationCap className="w-4 h-4 text-indigo-400" />
                    )}
                    <span className="text-sm text-slate-300">{user.full_name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="text-slate-400 hover:text-white"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center space-y-8 max-w-4xl">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-white">
              Master IELTS Reading
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              A comprehensive platform for IELTS reading test preparation with AI-powered passage creation
            </p>
          </div>

          <div className="flex gap-4 justify-center flex-wrap">
            {isAuthenticated && user ? (
              // Show role-specific buttons
              user.role === UserRole.ADMIN ? (
                <>
                  <Link to="/admin">
                    <Button size="lg" className="text-lg px-8 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/25">
                      <Shield className="w-5 h-5 mr-2" />
                      Admin Dashboard
                    </Button>
                  </Link>
                  <Link to="/student">
                    <Button size="lg" variant="outline" className="text-lg px-8 border-slate-700 hover:bg-slate-800">
                      <GraduationCap className="w-5 h-5 mr-2" />
                      View as Student
                    </Button>
                  </Link>
                </>
              ) : user.role === UserRole.TEACHER ? (
                <>
                  <Link to="/admin">
                    <Button size="lg" className="text-lg px-8 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/25">
                      <BookOpen className="w-5 h-5 mr-2" />
                      Teacher Dashboard
                    </Button>
                  </Link>
                  <Link to="/admin/classes">
                    <Button size="lg" variant="outline" className="text-lg px-8 border-slate-700 hover:bg-slate-800">
                      Manage Classes
                    </Button>
                  </Link>
                  <Link to="/admin/sessions">
                    <Button size="lg" variant="outline" className="text-lg px-8 border-slate-700 hover:bg-slate-800">
                      Manage Sessions
                    </Button>
                  </Link>
                </>
              ) : (
                <Link to="/student">
                  <Button size="lg" className="text-lg px-8 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/25">
                    <GraduationCap className="w-5 h-5 mr-2" />
                    Start Practice
                  </Button>
                </Link>
              )
            ) : (
              // Show login/register buttons for unauthenticated users
              <>
                <Link to="/login">
                  <Button size="lg" className="text-lg px-8 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/25">
                    Sign In to Start
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="lg" variant="outline" className="text-lg px-8 border-slate-700 hover:bg-slate-800">
                    Create Account
                  </Button>
                </Link>
              </>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm">
              <div className="w-12 h-12 rounded-lg bg-indigo-500/20 flex items-center justify-center mb-4 mx-auto">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="font-semibold mb-2 text-white">AI-Powered</h3>
              <p className="text-sm text-slate-400">
                Upload images and let AI extract passage text and generate questions automatically
              </p>
            </div>
            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm">
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4 mx-auto">
                <span className="text-2xl">🛡️</span>
              </div>
              <h3 className="font-semibold mb-2 text-white">Tab Detection</h3>
              <p className="text-sm text-slate-400">
                Monitor student activity to ensure fair testing conditions
              </p>
            </div>
            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm">
              <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center mb-4 mx-auto">
                <span className="text-2xl">📚</span>
              </div>
              <h3 className="font-semibold mb-2 text-white">Comprehensive</h3>
              <p className="text-sm text-slate-400">
                Support for all IELTS question types and authentic test formats
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-4 text-center text-sm text-slate-500">
        IELTS Reading Practice Platform © 2026
      </footer>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthInitializer>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.TEACHER]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/passage/new"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <PassageCreator />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/passage/new-from-images"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <PassageCreatorNew />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/passages"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <PassageLibrary />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/test/new"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <TestBuilder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/test/:testId"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <TestDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/test/:testId/passage/:passageId"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <PassageEdit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/passage/preview"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <PassagePreviewDemo />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/classes"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.TEACHER]}>
                <ClassManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/classes/:classId"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.TEACHER]}>
                <ClassDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/sessions"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.TEACHER]}>
                <SessionManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/sessions/:sessionId/monitor"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.TEACHER]}>
                <SessionMonitoring />
              </ProtectedRoute>
            }
          />

          {/* Protected Student Routes */}
          <Route
            path="/student"
            element={
              <ProtectedRoute>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/test"
            element={
              <ProtectedRoute>
                <TestInterface />
              </ProtectedRoute>
            }
          />
          <Route
            path="/test/take"
            element={
              <ProtectedRoute>
                <TakeTestPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/sessions"
            element={
              <ProtectedRoute>
                <MySessions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/sessions/:sessionId/waiting"
            element={
              <ProtectedRoute>
                <SessionWaitingRoom />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/sessions/:sessionId/test"
            element={
              <ProtectedRoute>
                <SessionTestInterface />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/sessions/:sessionId/results"
            element={
              <ProtectedRoute>
                <SessionResults />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthInitializer>
    </Router>
  );
}

export default App;
