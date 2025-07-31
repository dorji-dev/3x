const Loader = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          {/* Outer rotating ring */}
          <div className="w-12 h-12 border-4 border-muted rounded-full animate-spin border-t-primary"></div>
          {/* Inner pulsing dot */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full animate-pulse"></div>
        </div>
        <div className="text-center">
          <p className="  text-muted-foreground mt-1">A second or two...</p>
        </div>
      </div>
    </div>
  )
}

export default Loader
