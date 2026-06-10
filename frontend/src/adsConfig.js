// Ad network configuration
// Banner ads use the atOptions + invoke.js pattern (HighPerformanceFormat / Adsterra family)
// Each slot can use a different key to show unique ad creatives per placement.

export const AD_CONFIG = {
  // Banner ad units (use the atOptions + invoke.js pattern)
  banners: {
    header: {
      enabled: true,
      key: '35116f98b237bd9cd2139a0aed6da866',
      width: 728,
      height: 90,
      label: 'Header Banner',
    },
    sidebar: {
      enabled: false,
      key: '35116f98b237bd9cd2139a0aed6da866',
      width: 160,
      height: 600,
      label: 'Sidebar Skyscraper',
    },
    inline: {
      enabled: true,
      key: '35116f98b237bd9cd2139a0aed6da866',
      width: 300,
      height: 250,
      label: 'Inline Rectangle',
    },
    footer: {
      enabled: true,
      key: '35116f98b237bd9cd2139a0aed6da866',
      width: 728,
      height: 90,
      label: 'Footer Banner',
    },
  },

  // Smartlink — disabled
  smartlink: {
    enabled: false,
    key: '29548024',
    script: '',
  },

  // Popunder — disabled (intrusive UX)
  popunder: {
    enabled: false,
    script: '',
  },

  // Social Bar — disabled
  socialBar: {
    enabled: false,
    script: '',
  },

  // Set to true once you have unique ad keys per slot
  useUniqueKeysPerSlot: false,
};


