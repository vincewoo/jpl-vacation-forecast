// Quick test script for the vacation recommender
// Run with: node test-recommender.js

const workSchedule = { type: '9/80', rdoPattern: 'odd-fridays' };

const holidays = [
  { name: 'Memorial Day', date: '2026-05-25', hours: 9 },
  { name: 'Independence Day', date: '2026-07-03', hours: 9 },
  { name: 'Labor Day', date: '2026-09-07', hours: 9 },
  { name: 'Thanksgiving', date: '2026-11-26', hours: 9 },
  { name: 'Day After Thanksgiving', date: '2026-11-25', hours: 9 },
  { name: 'Christmas', date: '2026-12-24', hours: 9 },
  { name: 'Christmas', date: '2026-12-25', hours: 9 }
];

console.log('Vacation Recommender Test');
console.log('=========================\n');
console.log('Work Schedule:', workSchedule.type, workSchedule.rdoPattern);
console.log('Holidays:', holidays.length);
console.log('\nLooking for high-value vacation opportunities...\n');

// Example high-value periods:
console.log('Example High-Value Opportunities:');
console.log('\n1. Memorial Day Weekend (May 25 is Monday)');
console.log('   Take Tue 5/26 - Fri 5/29 = 4 work days (36 hours)');
console.log('   Get: Sat 5/23, Sun 5/24, Mon 5/25 (holiday), Tue-Fri, Sat 5/30, Sun 5/31');
console.log('   Total: 9 days off for 36 hours = 0.25 days/hour efficiency');

console.log('\n2. Thanksgiving Week (Thu 11/26 + Wed 11/25 for 9/80)');
console.log('   Take Mon 11/23 - Wed 11/25 OR Fri 11/27 = 3 work days (~27 hours)');
console.log('   Get: Sat-Sun + Mon-Wed (vacation) + Thu-Fri (holidays) + Sat-Sun');
console.log('   Total: 9-10 days off for ~27 hours = ~0.33 days/hour efficiency');

console.log('\n3. Christmas (Thu 12/24 + Fri 12/25)');
console.log('   Take Mon 12/21 - Wed 12/23 = 3 work days (27 hours)');
console.log('   Get: Sat-Sun + Mon-Wed (vacation) + Thu-Fri (holidays) + Sat-Sun');
console.log('   Total: 9 days off for 27 hours = 0.33 days/hour efficiency');

console.log('\n✓ Recommender should find these and similar opportunities!');
