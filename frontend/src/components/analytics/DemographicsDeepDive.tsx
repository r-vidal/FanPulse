'use client'

import { useState } from 'react'
import { mockDemographics, Demographics } from '@/lib/mockData'
import { Users, MapPin, Globe, TrendingUp } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

/**
 * Demographics Deep Dive
 * Comprehensive audience demographics analysis
 * Mock data: GET /api/analytics/{artist_id}/demographics
 */
export default function DemographicsDeepDive({ artistId }: { artistId?: string }) {
  const [data] = useState<Demographics>(mockDemographics())

  // Age distribution data for chart
  const ageData = Object.entries(data.age).map(([range, percentage]) => ({
    name: range,
    value: percentage,
  }))

  // Gender distribution data for chart
  const genderData = Object.entries(data.gender).map(([gender, percentage]) => ({
    name: gender.charAt(0).toUpperCase() + gender.slice(1),
    value: percentage,
  }))

  // Top cities sorted by fans
  const topCities = [...data.cities].sort((a, b) => b.fans - a.fans).slice(0, 10)

  // Colors for charts
  const ageColors = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981']
  const genderColors = ['#3B82F6', '#EC4899', '#8B5CF6']

  const totalFans = data.countries.reduce((sum, c) => sum + c.fans, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Demographics Deep Dive</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Comprehensive analysis of your audience demographics
        </p>
      </div>

      {/* Total Fans Card */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-blue-600 dark:bg-blue-500 rounded-full">
            <Users className="w-8 h-8 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Analyzed Fans</p>
            <p className="text-4xl font-bold text-gray-900 dark:text-white">
              {totalFans.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Across {data.countries.length} countries and {data.cities.length} cities
            </p>
          </div>
        </div>
      </div>

      {/* Age & Gender Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Age Distribution */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Age Distribution</h3>

          <div className="h-80 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ageData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {ageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={ageColors[index % ageColors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value}%`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Age breakdown list */}
          <div className="mt-6 space-y-2">
            {ageData.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: ageColors[i % ageColors.length] }}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{item.name}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Gender Distribution */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Gender Distribution</h3>

          <div className="h-80 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={genderColors[index % genderColors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value}%`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Gender breakdown list */}
          <div className="mt-6 space-y-2">
            {genderData.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: genderColors[i % genderColors.length] }}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{item.name}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Countries */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Countries</h3>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.countries} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
              <YAxis type="category" dataKey="country" tick={{ fill: '#9CA3AF', fontSize: 12 }} width={80} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#F3F4F6'
                }}
                formatter={(value: number) => [`${value.toLocaleString()} fans (${((value / totalFans) * 100).toFixed(1)}%)`, 'Fans']}
              />
              <Bar dataKey="fans" fill="#3B82F6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Country breakdown table */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Country</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Fans</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Percentage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {data.countries.map((country, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{country.country}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">
                    {country.fans.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900 dark:text-white">
                    {country.percentage}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Cities */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center gap-2 mb-6">
          <MapPin className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top 10 Cities by Fan Concentration</h3>
        </div>

        {/* City Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topCities.map((city, i) => (
            <div
              key={i}
              className="relative p-4 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-xl"
            >
              {/* Rank Badge */}
              <div className="absolute top-2 right-2 w-8 h-8 bg-purple-600 dark:bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">#{i + 1}</span>
              </div>

              <div className="mb-3">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white">{city.city}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{city.country}</p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">Fans</p>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-300">
                    {city.fans.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">% of Total</p>
                  <p className="text-lg font-semibold text-purple-700 dark:text-purple-400">
                    {((city.fans / totalFans) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Coordinates */}
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                📍 {city.lat.toFixed(2)}, {city.lng.toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        {/* Map Placeholder */}
        <div className="mt-6 bg-gray-100 dark:bg-gray-800 rounded-xl p-8 text-center border-2 border-dashed border-gray-300 dark:border-gray-700">
          <MapPin className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Interactive Map Visualization</p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Integrate with Mapbox or Google Maps API to display fan concentration heatmap
          </p>
          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-500">
            <span>🗺️ Heatmap overlay</span>
            <span>📍 City markers</span>
            <span>🎯 Tour routing</span>
          </div>
        </div>
      </div>

      {/* All Cities List */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">All Cities</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  City
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Country
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Fans
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  % of Total
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Coordinates
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {[...data.cities].sort((a, b) => b.fans - a.fans).map((city, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {i + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {city.city}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {city.country}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700 dark:text-gray-300">
                    {city.fans.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900 dark:text-white">
                    {((city.fans / totalFans) * 100).toFixed(2)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-right text-gray-500 dark:text-gray-500">
                    {city.lat.toFixed(2)}, {city.lng.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300">Key Insights</h3>
        </div>
        <ul className="space-y-2">
          <li className="flex items-start gap-3">
            <div className="p-1 bg-blue-600 dark:bg-blue-500 rounded-full mt-0.5">
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
            </div>
            <span className="text-sm text-blue-800 dark:text-blue-200">
              Your core audience is {ageData[0].name} years old, representing {ageData[0].value}% of listeners
            </span>
          </li>
          <li className="flex items-start gap-3">
            <div className="p-1 bg-blue-600 dark:bg-blue-500 rounded-full mt-0.5">
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
            </div>
            <span className="text-sm text-blue-800 dark:text-blue-200">
              {data.countries[0].country} accounts for {data.countries[0].percentage}% of your fanbase
            </span>
          </li>
          <li className="flex items-start gap-3">
            <div className="p-1 bg-blue-600 dark:bg-blue-500 rounded-full mt-0.5">
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
            </div>
            <span className="text-sm text-blue-800 dark:text-blue-200">
              Top 3 cities ({topCities[0].city}, {topCities[1].city}, {topCities[2].city}) represent {((topCities.slice(0, 3).reduce((sum, c) => sum + c.fans, 0) / totalFans) * 100).toFixed(1)}% of total fans
            </span>
          </li>
          <li className="flex items-start gap-3">
            <div className="p-1 bg-blue-600 dark:bg-blue-500 rounded-full mt-0.5">
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
            </div>
            <span className="text-sm text-blue-800 dark:text-blue-200">
              Consider prioritizing tour dates in {topCities[0].city} and {topCities[1].city} for maximum reach
            </span>
          </li>
        </ul>
      </div>

      {/* Mock Data Notice */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          <strong>Development Mode:</strong> Currently displaying mock data.
          Connect to <code className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/50 rounded text-xs">
            GET /api/analytics/{'{artist_id}'}/demographics
          </code> for real-time demographics data.
        </p>
      </div>
    </div>
  )
}
