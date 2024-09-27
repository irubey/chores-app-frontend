// import React, { useEffect, useState } from 'react';
// import { useSelector, useDispatch } from 'react-redux';
// import { fetchRecentActivities, selectRecentActivities } from '../../store/slices/activitySlice';
// import { useSocket } from '../../contexts/SocketContext';
// import { useTheme } from '../../contexts/ThemeContext';
// import Button from '../common/Button';
// import { Activity } from '../../types/activity';

// const RecentActivityFeed: React.FC = () => {
//   const dispatch = useDispatch();
//   const { activities, isLoading, error } = useSelector(selectRecentActivities);
//   const socket = useSocket();
//   const { theme } = useTheme();
//   const [page, setPage] = useState(1);

//   useEffect(() => {
//     dispatch(fetchRecentActivities(page));
//   }, [dispatch, page]);

//   useEffect(() => {
//     socket.on('activity_new', (newActivity: Activity) => {
//       dispatch({ type: 'activities/activityAdded', payload: newActivity });
//     });

//     return () => {
//       socket.off('activity_new');
//     };
//   }, [socket, dispatch]);

//   const handleLoadMore = () => {
//     setPage(prevPage => prevPage + 1);
//   };

//   const getActivityIcon = (type: string) => {
//     switch (type) {
//       case 'MESSAGE':
//         return '💬';
//       case 'CHORE':
//         return '🧹';
//       case 'EXPENSE':
//         return '💰';
//       case 'EVENT':
//         return '📅';
//       default:
//         return '📌';
//     }
//   };

//   if (isLoading && activities.length === 0) {
//     return <div className="text-center">Loading activities...</div>;
//   }

//   if (error) {
//     return <div className="text-red-500">Error: {error}</div>;
//   }

//   return (
//     <div className={`bg-white ${theme === 'dark' ? 'bg-gray-800 text-white' : ''} rounded-lg shadow p-4`}>
//       <h2 className="text-h2 mb-4">Recent Activity</h2>
//       <ul className="space-y-4">
//         {activities.map((activity) => (
//           <li key={activity.id} className="flex items-start space-x-3">
//             <span className="text-2xl">{getActivityIcon(activity.type)}</span>
//             <div>
//               <p className={`font-semibold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
//                 {activity.message}
//               </p>
//               <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
//                 {new Date(activity.createdAt).toLocaleString()}
//               </p>
//             </div>
//           </li>
//         ))}
//       </ul>
//       {activities.length > 0 && (
//         <div className="mt-4 text-center">
//           <Button
//             onClick={handleLoadMore}
//             isLoading={isLoading}
//             className={`px-4 py-2 ${
//               theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
//             } text-white rounded`}
//           >
//             Load More
//           </Button>
//         </div>
//       )}
//     </div>
//   );
// };

// export default RecentActivityFeed;