const fs = require('fs');
const file = 'frontend/app/(tabs)/_layout.tsx';
let data = fs.readFileSync(file, 'utf8');

const newTab = `
      <Tabs.Screen
        name="ai-plan"
        options={{
          title: t('AI Plan'),
          href: user?.role === 'member' ? '/(tabs)/ai-plan' : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bulb" size={size} color={color} />
          ),
        }}
      />`;

const search = `<Tabs.Screen\n        name="profile"`;
if(data.includes(search)) {
    data = data.replace(search, newTab + '\\n' + search);
} else {
    // try different spacing
    data = data.replace(/<Tabs\.Screen\s*name="profile"/, newTab + '\\n      <Tabs.Screen\\n        name="profile"');
}
fs.writeFileSync(file, data);
