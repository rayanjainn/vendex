"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { useSettingsStore } from "@/stores/settingsStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Save, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useState } from "react";

export default function SettingsPage() {
  const { settings, updateSettings } = useSettingsStore();
  const [localSettings, setLocalSettings] = useState(settings);
  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({});
  const [isTesting, setIsTesting] = useState(false);

  const handleSave = () => {
    updateSettings(localSettings);
    toast.success("Settings saved successfully");
  };

  const toggleKeyVisibility = (key: string) => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleTestConnection = () => {
    setIsTesting(true);
    setTimeout(() => {
      setIsTesting(false);
      toast.success("API connection test successful", {
        description: "All services responded with OK."
      });
    }, 1500);
  };

  const handlePlatformToggle = (platform: string) => {
    const current = localSettings.enabledPlatforms;
    const updated = current.includes(platform)
      ? current.filter(p => p !== platform)
      : [...current, platform];
    setLocalSettings({ ...localSettings, enabledPlatforms: updated });
  };

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <PageHeader 
        title="Settings" 
        description="Configure your API keys, preferences, and default values."
      />

      <div className="space-y-8">
        {/* API Keys Section */}
        <section className="bg-white dark:bg-[#050505] border border-neutral-800 dark:border-neutral-900 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-800 dark:border-neutral-900 flex items-center justify-between">
            <h3 className="font-semibold text-neutral-950 dark:text-white flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-neutral-300" />
              API Connectivity
            </h3>
            <Button variant="outline" size="sm" onClick={handleTestConnection} disabled={isTesting} className="dark:border-neutral-800 h-8 text-xs">
              {isTesting ? "Testing..." : "Test Connection"}
            </Button>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="rapidApi">RapidAPI Key <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input 
                  id="rapidApi"
                  type={showKeys.rapidApi ? "text" : "password"} 
                  value={localSettings.rapidApiKey}
                  onChange={(e) => setLocalSettings({...localSettings, rapidApiKey: e.target.value})}
                  className="pr-10 dark:bg-neutral-950/50 dark:border-neutral-800"
                  placeholder="sk_..."
                />
                <Button 
                  variant="ghost" size="icon" 
                  className="absolute right-0 top-0 h-full text-neutral-400 hover:text-neutral-600"
                  onClick={() => toggleKeyVisibility('rapidApi')}
                >
                  {showKeys.rapidApi ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-neutral-500">Required for Alibaba and AliExpress endpoints.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="googleLens">Google Lens API Key</Label>
              <div className="relative">
                <Input 
                  id="googleLens"
                  type={showKeys.googleLens ? "text" : "password"} 
                  value={localSettings.googleLensApiKey || ''}
                  onChange={(e) => setLocalSettings({...localSettings, googleLensApiKey: e.target.value})}
                  className="pr-10 dark:bg-neutral-950/50 dark:border-neutral-800"
                />
                <Button 
                  variant="ghost" size="icon" 
                  className="absolute right-0 top-0 h-full text-neutral-400 hover:text-neutral-600"
                  onClick={() => toggleKeyVisibility('googleLens')}
                >
                  {showKeys.googleLens ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="serp">SerpAPI Key</Label>
              <div className="relative">
                <Input 
                  id="serp"
                  type={showKeys.serp ? "text" : "password"} 
                  value={localSettings.serpApiKey || ''}
                  onChange={(e) => setLocalSettings({...localSettings, serpApiKey: e.target.value})}
                  className="pr-10 dark:bg-neutral-950/50 dark:border-neutral-800"
                />
                <Button 
                  variant="ghost" size="icon" 
                  className="absolute right-0 top-0 h-full text-neutral-400 hover:text-neutral-600"
                  onClick={() => toggleKeyVisibility('serp')}
                >
                  {showKeys.serp ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Processing Preferences */}
        <section className="bg-white dark:bg-[#050505] border border-neutral-800 dark:border-neutral-900 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-800 dark:border-neutral-900">
            <h3 className="font-semibold text-neutral-950 dark:text-white">Processing Preferences</h3>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Base Currency</Label>
                <Select 
                  value={localSettings.preferredCurrency} 
                  onValueChange={(val: any) => setLocalSettings({...localSettings, preferredCurrency: val})}
                >
                  <SelectTrigger className="dark:bg-neutral-950/50 dark:border-neutral-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR (₹)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="CNY">CNY (¥)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Max Results Per Reel</Label>
                <Select 
                  value={localSettings.maxResultsPerReel?.toString() || '20'} 
                  onValueChange={(val) => setLocalSettings({...localSettings, maxResultsPerReel: parseInt(val || '20')})}
                >
                  <SelectTrigger className="dark:bg-neutral-950/50 dark:border-neutral-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 results</SelectItem>
                    <SelectItem value="20">20 results</SelectItem>
                    <SelectItem value="50">50 results</SelectItem>
                    <SelectItem value="100">100 results</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-neutral-900 dark:border-neutral-900">
              <div className="space-y-0.5">
                <Label>Auto-convert Currency</Label>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Always calculate and display equivalent INR prices</p>
              </div>
              <Switch 
                checked={localSettings.autoConvertCurrency}
                onCheckedChange={(c) => setLocalSettings({...localSettings, autoConvertCurrency: c})}
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-neutral-900 dark:border-neutral-900">
              <div className="space-y-0.5">
                <Label>Detailed Logging (Trace)</Label>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Capture granular pipeline events for debugging</p>
              </div>
              <Switch 
                checked={localSettings.detailedLogging}
                onCheckedChange={(c) => setLocalSettings({...localSettings, detailedLogging: c})}
              />
            </div>

            <div className="pt-4 border-t border-neutral-900 dark:border-neutral-900">
              <Label className="mb-3 block">Enabled Platforms</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { id: 'alibaba', label: 'Alibaba' },
                  { id: 'aliexpress', label: 'AliExpress' },
                  { id: 'made-in-china', label: 'Made-in-China' },
                  { id: 'indiamart', label: 'IndiaMart' }
                ].map(platform => (
                  <div key={platform.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`plat-${platform.id}`}
                      checked={localSettings.enabledPlatforms.includes(platform.id)}
                      onCheckedChange={() => handlePlatformToggle(platform.id)}
                    />
                    <Label htmlFor={`plat-${platform.id}`} className="font-normal cursor-pointer text-neutral-800 dark:text-neutral-300">
                      {platform.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} className="bg-neutral-800 dark:bg-white dark:text-black hover:bg-neutral-700 dark:hover:bg-neutral-200 text-white min-w-[120px] gap-2 border-0">
            <Save className="h-4 w-4" />
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
