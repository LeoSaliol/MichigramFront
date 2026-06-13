const SkeletonBase = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse bg-formColorLight/20 dark:bg-white/5 ${className}`} />
);

export function SkeletonProfileHeader() {
  return (
    <div className="flex flex-col sm:flex-row items-center mt-8 gap-6">
      <SkeletonBase className="w-32 h-32 rounded-full" />
      <div className="flex-1 text-center sm:text-left space-y-4 w-full">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <SkeletonBase className="h-8 w-48 rounded-lg" />
          <div className="sm:ml-auto flex gap-2">
            <SkeletonBase className="h-10 w-32 rounded-lg" />
            <SkeletonBase className="h-10 w-10 rounded-lg" />
          </div>
        </div>
        <SkeletonBase className="h-4 w-64 rounded mx-auto sm:mx-0" />
        <div className="flex items-center justify-center sm:justify-start gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center space-y-1">
              <SkeletonBase className="h-6 w-12 rounded mx-auto" />
              <SkeletonBase className="h-3 w-16 rounded mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SkeletonPostGrid({ count = 9 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 gap-1">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonBase key={i} className="aspect-square rounded-sm" />
      ))}
    </div>
  );
}

export function SkeletonFeedPost() {
  return (
    <div className="bg-primaryWhite rounded-2xl overflow-hidden border border-formColorLight/20">
      <div className="flex items-center justify-between p-4 border-b border-formColorLight/10">
        <div className="flex items-center gap-3">
          <SkeletonBase className="w-11 h-11 rounded-full" />
          <div className="space-y-2">
            <SkeletonBase className="h-4 w-28 rounded" />
            <SkeletonBase className="h-3 w-16 rounded" />
          </div>
        </div>
        <SkeletonBase className="h-3 w-12 rounded" />
      </div>
      <SkeletonBase className="w-[60%] mx-auto aspect-[4/3] max-h-[550px]" />
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-6">
          <SkeletonBase className="h-7 w-16 rounded" />
          <SkeletonBase className="h-7 w-16 rounded" />
          <SkeletonBase className="h-7 w-7 rounded ml-auto" />
        </div>
        <SkeletonBase className="h-4 w-3/4 rounded" />
        <SkeletonBase className="h-3 w-32 rounded" />
      </div>
    </div>
  );
}

export function SkeletonFeed({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonFeedPost key={i} />
      ))}
    </div>
  );
}

export function SkeletonConversationItem() {
  return (
    <div className="flex items-center gap-4 w-full p-4 border-b border-formColorLight/10">
      <SkeletonBase className="w-14 h-14 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2 text-left">
        <SkeletonBase className="h-4 w-32 rounded" />
        <SkeletonBase className="h-3 w-48 rounded" />
      </div>
      <div className="flex flex-col items-end gap-1">
        <SkeletonBase className="h-5 w-10 rounded-full" />
        <SkeletonBase className="h-3 w-8 rounded" />
      </div>
    </div>
  );
}

export function SkeletonConversationList({ count = 6 }: { count?: number }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonConversationItem key={i} />
      ))}
    </div>
  );
}

export function SkeletonNotificationItem() {
  return (
    <div className="flex items-start gap-3 p-4 border-b border-formColorLight/10">
      <SkeletonBase className="w-10 h-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonBase className="h-4 w-3/4 rounded" />
        <SkeletonBase className="h-3 w-20 rounded" />
      </div>
      <SkeletonBase className="w-4 h-4 rounded-full flex-shrink-0 mt-1" />
    </div>
  );
}

export function SkeletonNotificationList({ count = 5 }: { count?: number }) {
  return (
    <div className="bg-primaryWhite rounded-2xl overflow-hidden border border-formColorLight/20">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonNotificationItem key={i} />
      ))}
    </div>
  );
}

export function SkeletonCommentItem() {
  return (
    <div className="flex gap-2">
      <SkeletonBase className="w-8 h-8 rounded-full flex-shrink-0 mt-0.5" />
      <div className="flex-1 space-y-1.5">
        <SkeletonBase className="h-4 w-40 rounded" />
        <SkeletonBase className="h-3 w-16 rounded" />
      </div>
    </div>
  );
}

export function SkeletonCommentsList({ count = 4 }: { count?: number }) {
  return (
    <div className="p-4 space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCommentItem key={i} />
      ))}
    </div>
  );
}
