import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatNumber } from '@/lib/utils'

export default function HomePage() {
  // Mock data for demonstration
  const stats = {
    totalPosts: 1234,
    totalImpressions: 567890,
    totalEngagement: 12345,
    engagementRate: 2.18,
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold text-tron-blue mb-4 animate-fade-in">
          X-manage-app
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-slide-in">
          A modern web application for managing your X (formerly Twitter) posts with 
          comprehensive analytics and insights.
        </p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <Card className="card-tron">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-tron-blue">
              {formatNumber(stats.totalPosts)}
            </div>
          </CardContent>
        </Card>

        <Card className="card-tron">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Impressions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-tron-cyan">
              {formatNumber(stats.totalImpressions)}
            </div>
          </CardContent>
        </Card>

        <Card className="card-tron">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Engagement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-tron-orange">
              {formatNumber(stats.totalEngagement)}
            </div>
          </CardContent>
        </Card>

        <Card className="card-tron">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Engagement Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-tron-blue">
              {stats.engagementRate}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Features Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <Card className="card-tron">
          <CardHeader>
            <CardTitle className="text-tron-blue">Analytics Dashboard</CardTitle>
            <CardDescription>
              Comprehensive insights into your post performance with real-time metrics
              and trend analysis.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Real-time engagement tracking</li>
              <li>• Performance trend analysis</li>
              <li>• Content optimization insights</li>
              <li>• Audience engagement patterns</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="card-tron">
          <CardHeader>
            <CardTitle className="text-tron-cyan">Post Management</CardTitle>
            <CardDescription>
              Efficiently manage your X posts with advanced filtering and 
              organization tools.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Advanced post filtering</li>
              <li>• Bulk operations support</li>
              <li>• Content categorization</li>
              <li>• Scheduled post management</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* CTA Section */}
      <div className="text-center">
        <Card className="card-tron max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-tron-blue">Get Started</CardTitle>
            <CardDescription>
              Connect your X account to start analyzing your post performance.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="tron" className="w-full">
              Connect X Account
            </Button>
            <Button variant="outline" className="w-full">
              Learn More
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="text-center mt-16 pt-8 border-t border-tron-blue/20">
        <p className="text-sm text-muted-foreground">
          Built with Next.js, Tailwind CSS, and shadcn/ui
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          © 2024 X-manage-app. All rights reserved.
        </p>
      </footer>
    </div>
  )
}