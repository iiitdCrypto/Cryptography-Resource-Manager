import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';

const Lectures = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch courses on component mount
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get('http://0.0.0.0:5001/api/courses', {
          headers: {
            'x-auth-token': localStorage.getItem('token')
          }
        });
        setCourses(response.data);
      } catch (error) {
        console.error('Error fetching courses:', error);
      }
    };
    fetchCourses();
  }, []);

  // Fetch lectures when course is selected
  useEffect(() => {
    if (selectedCourse) {
      const fetchLectures = async () => {
        setLoading(true);
        try {
          const response = await axios.get(`http://0.0.0.0:5001/api/lectures/${selectedCourse}`, {
            headers: {
              'x-auth-token': localStorage.getItem('token')
            }
          });
          setLectures(response.data);
        } catch (error) {
          console.error('Error fetching lectures:', error);
        }
        setLoading(false);
      };
      fetchLectures();
    }
  }, [selectedCourse]);

  return (
    <LecturesContainer>
      <div className="container">
        <PageHeader>
          <PageTitle>Cryptography Lectures</PageTitle>
          <PageDescription>
            Explore our comprehensive collection of cryptography lectures at IIITD
          </PageDescription>
        </PageHeader>

        <SectionContainer>
          {/* <SectionTitle>Lectures at crypto-iiitd</SectionTitle> */}
          
          <CourseSelect
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
          >
            <option value="">Select a course</option>
            {courses.map(course => (
              <option key={course._id} value={course._id}>
                {course.name}
              </option>
            ))}
          </CourseSelect>

          {selectedCourse && (
            <TableContainer>
              {loading ? (
                <LoadingText>Loading lectures...</LoadingText>
              ) : (
                <LectureTable>
                  <thead>
                    <tr>
                      <th>Lecture No.</th>
                      <th>Topic</th>
                      <th>Date</th>
                      <th>Get Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lectures.map(lecture => (
                      <tr key={lecture._id}>
                        <td>{lecture.lectureNo}</td>
                        <td>{lecture.topic}</td>
                        <td>{new Date(lecture.date).toLocaleDateString()}</td>
                        <td>
                          <DownloadButton 
                            href={lecture.notesUrl} 
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Download
                          </DownloadButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </LectureTable>
              )}
            </TableContainer>
          )}
        </SectionContainer>
      </div>
    </LecturesContainer>
  );
};

const LecturesContainer = styled.div`
  padding: 2rem 0;
`;

const PageHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const PageTitle = styled.h1`
  font-size: 2.5rem;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 0.5rem;
`;

const PageDescription = styled.p`
  color: ${({ theme }) => theme.colors.textLight};
  font-size: 1.1rem;
`;

const SectionContainer = styled.div`
  margin-top: 3rem;
`;

const SectionTitle = styled.h2`
  font-size: 2rem;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 1.5rem;
  text-align: left;
`;

const CourseSelect = styled.select`
  width: 100%;
  max-width: 400px;
  padding: 0.8rem;
  margin: 0 0 2rem 0;
  display: block;
  border: 1px solid ${({ theme }) => theme.colors.gray};
  border-radius: 5px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const TableContainer = styled.div`
  overflow-x: auto;
`;

const LectureTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background-color: white;
  box-shadow: ${({ theme }) => theme.shadows.small};
  border-radius: 8px;
  overflow: hidden;

  th, td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid ${({ theme }) => theme.colors.gray}30;
  }

  th {
    background-color: ${({ theme }) => theme.colors.primary};
    color: white;
    font-weight: 500;
  }

  tr:hover {
    background-color: ${({ theme }) => theme.colors.gray}10;
  }
`;

const DownloadButton = styled.a`
  display: inline-block;
  padding: 0.5rem 1rem;
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  text-decoration: none;
  border-radius: 4px;
  font-size: 0.9rem;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryDark};
  }
`;

const LoadingText = styled.p`
  text-align: center;
  color: ${({ theme }) => theme.colors.textLight};
  padding: 2rem 0;
`;

export default Lectures;