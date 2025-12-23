import { useState } from "react";
import { APP_NAME, SUPPORT_EMAIL } from "@/lib/brand";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Save, RefreshCw, Key, Bell, Shield, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminSettings = () => {
  const [general, setGeneral] = useState({
    platformName: APP_NAME,
    platformUrl: "https://academihub.com",
    supportEmail: SUPPORT_EMAIL,
    timezone: "UTC",
  });

  const [email, setEmail] = useState({
    smtpHost: "smtp.gmail.com",
    smtpPort: 587,
    senderEmail: SUPPORT_EMAIL,
    senderPassword: "••••••••••",
  });

  const [notifications, setNotifications] = useState({
    emailOnEnrollment: true,
    emailOnCompletion: true,
    emailOnAssignment: true,
    dailySummary: false,
  });

  const [security, setSecurity] = useState({
    enableTwoFactor: true,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    enforceStrongPasswords: true,
  });

  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSaveGeneral = async () => {
    setSaving(true);
    try {
      // API call would go here
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast({
        title: "Success",
        description: "General settings saved successfully",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEmail = async () => {
    setSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast({
        title: "Success",
        description: "Email settings saved successfully",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">System Settings</h1>
        <p className="text-slate-400">Manage platform configuration and preferences</p>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-slate-800 border-slate-700 w-full justify-start">
          <TabsTrigger value="general" className="data-[state=active]:bg-slate-700">
            General
          </TabsTrigger>
          <TabsTrigger value="email" className="data-[state=active]:bg-slate-700">
            <Bell className="w-4 h-4 mr-2" />
            Email
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-slate-700">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-slate-700">
            <Shield className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="data-[state=active]:bg-slate-700">
            <Database className="w-4 h-4 mr-2" />
            Maintenance
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">General Settings</CardTitle>
              <CardDescription>Basic platform configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-slate-300">Platform Name</Label>
                <Input
                  value={general.platformName}
                  onChange={(e) => setGeneral({ ...general, platformName: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Platform URL</Label>
                <Input
                  value={general.platformUrl}
                  onChange={(e) => setGeneral({ ...general, platformUrl: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Support Email</Label>
                <Input
                  type="email"
                  value={general.supportEmail}
                  onChange={(e) => setGeneral({ ...general, supportEmail: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Timezone</Label>
                <select
                  value={general.timezone}
                  onChange={(e) => setGeneral({ ...general, timezone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-md"
                >
                  <option value="UTC">UTC</option>
                  <option value="EST">EST (UTC-5)</option>
                  <option value="CST">CST (UTC-6)</option>
                  <option value="MST">MST (UTC-7)</option>
                  <option value="PST">PST (UTC-8)</option>
                </select>
              </div>

              <Button
                onClick={handleSaveGeneral}
                disabled={saving}
                className="bg-primary hover:bg-primary/90"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email" className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Email Configuration</CardTitle>
              <CardDescription>SMTP settings for system emails</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="bg-blue-900/20 border-blue-800 text-blue-300">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  These settings are used to send transactional emails to users
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label className="text-slate-300">SMTP Host</Label>
                <Input
                  value={email.smtpHost}
                  onChange={(e) => setEmail({ ...email, smtpHost: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">SMTP Port</Label>
                <Input
                  type="number"
                  value={email.smtpPort}
                  onChange={(e) => setEmail({ ...email, smtpPort: Number(e.target.value) })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Sender Email</Label>
                <Input
                  type="email"
                  value={email.senderEmail}
                  onChange={(e) => setEmail({ ...email, senderEmail: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Sender Password</Label>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    value={email.senderPassword}
                    readOnly
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  <Button variant="outline" size="sm" className="border-slate-600 hover:bg-slate-700">
                    <Key className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <Button onClick={handleSaveEmail} disabled={saving} className="bg-primary hover:bg-primary/90">
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Notification Preferences</CardTitle>
              <CardDescription>Control system notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(notifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                  <div>
                    <p className="text-white font-medium capitalize">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </p>
                    <p className="text-sm text-slate-400">
                      {key === "emailOnEnrollment"
                        ? "Send email when student enrolls"
                        : key === "emailOnCompletion"
                          ? "Send email when course is completed"
                          : key === "emailOnAssignment"
                            ? "Send email for new assignments"
                            : "Send daily system summary"}
                    </p>
                  </div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) =>
                        setNotifications({ ...notifications, [key]: e.target.checked })
                      }
                      className="w-4 h-4"
                    />
                  </label>
                </div>
              ))}

              <Button onClick={handleSaveEmail} disabled={saving} className="bg-primary hover:bg-primary/90">
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save Preferences"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Security Settings</CardTitle>
              <CardDescription>Manage system security policies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(security).map(([key, value]) => (
                <div key={key}>
                  {typeof value === "boolean" ? (
                    <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                      <p className="text-white font-medium capitalize">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </p>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => setSecurity({ ...security, [key]: e.target.checked })}
                          className="w-4 h-4"
                        />
                      </label>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label className="text-slate-300 capitalize">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </Label>
                      <Input
                        type="number"
                        value={value}
                        onChange={(e) => setSecurity({ ...security, [key]: Number(e.target.value) })}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                  )}
                </div>
              ))}

              <Button onClick={handleSaveEmail} disabled={saving} className="bg-primary hover:bg-primary/90">
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance */}
        <TabsContent value="maintenance" className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">System Maintenance</CardTitle>
              <CardDescription>Database and system operations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-slate-700/50 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-white font-medium">Database Backup</p>
                    <p className="text-sm text-slate-400">Last backup: Dec 22, 2025 at 03:00 AM</p>
                  </div>
                  <Button variant="outline" className="border-slate-600 hover:bg-slate-700">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Backup Now
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-slate-700/50 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-white font-medium">Clear Cache</p>
                    <p className="text-sm text-slate-400">Clears all system caches</p>
                  </div>
                  <Button variant="outline" className="border-slate-600 hover:bg-slate-700">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Clear
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-slate-700/50 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-white font-medium">Database Optimization</p>
                    <p className="text-sm text-slate-400">Optimize database tables</p>
                  </div>
                  <Button variant="outline" className="border-slate-600 hover:bg-slate-700">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Optimize
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-yellow-900/20 border border-yellow-800 rounded-lg">
                <Alert className="bg-transparent border-0">
                  <AlertCircle className="h-4 w-4 text-yellow-400" />
                  <AlertDescription className="text-yellow-300">
                    Maintenance operations may affect system performance. Perform during low-traffic hours.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;
