import React from 'react';
import styled from 'styled-components';

const CryptoIIITD = () => {
  return (
    <PageContainer>
      <Header>
        <h1>Crypto@IIITD</h1>
        <p>Center of Excellence in Cryptography Research and Development</p>
      </Header>

      <ContentSection>
        <SectionTitle>About Our Program</SectionTitle>
        <Description>
          The Cryptography Research Program at IIIT-Delhi is dedicated to advancing the field of cryptography
          through cutting-edge research, education, and industry collaboration. Our focus areas include:
        </Description>

        <FocusAreas>
          <FocusArea>
            <h3>Research Areas</h3>
            <ul>
              <li>Post-Quantum Cryptography</li>
              <li>Blockchain Technology</li>
              <li>Zero-Knowledge Proofs</li>
              <li>Homomorphic Encryption</li>
              <li>Cryptanalysis</li>
            </ul>
          </FocusArea>

          <FocusArea>
            <h3>Education</h3>
            <ul>
              <li>Advanced Cryptography Courses</li>
              <li>Research Opportunities</li>
              <li>Industry Partnerships</li>
              <li>Workshops and Seminars</li>
              <li>International Collaborations</li>
            </ul>
          </FocusArea>

          <FocusArea>
            <h3>Innovation</h3>
            <ul>
              <li>Security Solutions</li>
              <li>Privacy Technologies</li>
              <li>Protocol Development</li>
              <li>Applied Cryptography</li>
              <li>Industry Projects</li>
            </ul>
          </FocusArea>
        </FocusAreas>
      </ContentSection>

      <ContentSection>
        <SectionTitle>Our Vision</SectionTitle>
        <Description>
          To be a world-leading center for cryptographic research and education, fostering innovation
          and developing secure solutions for the digital world. We aim to bridge the gap between
          theoretical research and practical applications in cryptography.
        </Description>
      </ContentSection>

      <ContentSection>
        <SectionTitle>Get Involved</SectionTitle>
        <Description>
          Whether you're a student, researcher, or industry partner, there are many ways to get
          involved with our cryptography program. Contact us to learn more about:
        </Description>
        <ContactInfo>
          <InfoItem>
            <strong>Email:</strong> crypto@iiitd.ac.in
          </InfoItem>
          <InfoItem>
            <strong>Location:</strong> IIIT-Delhi, Okhla Industrial Estate, Phase III
          </InfoItem>
          <InfoItem>
            <strong>Phone:</strong> +91-11-26907XXX
          </InfoItem>
        </ContactInfo>
      </ContentSection>
    </PageContainer>
  );
};

const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const Header = styled.header`
  text-align: center;
  margin-bottom: 3rem;
  padding: 2rem;
  background: ${({ theme }) => theme.colors.background};
  border-radius: 10px;
  box-shadow: ${({ theme }) => theme.shadows.medium};

  h1 {
    font-size: 2.5rem;
    color: ${({ theme }) => theme.colors.primary};
    margin-bottom: 1rem;
  }

  p {
    font-size: 1.2rem;
    color: ${({ theme }) => theme.colors.textLight};
  }
`;

const ContentSection = styled.section`
  margin-bottom: 3rem;
  padding: 2rem;
  background: white;
  border-radius: 10px;
  box-shadow: ${({ theme }) => theme.shadows.small};
`;

const SectionTitle = styled.h2`
  font-size: 2rem;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 1.5rem;
`;

const Description = styled.p`
  font-size: 1.1rem;
  color: ${({ theme }) => theme.colors.text};
  line-height: 1.6;
  margin-bottom: 2rem;
`;

const FocusAreas = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
`;

const FocusArea = styled.div`
  background: ${({ theme }) => theme.colors.backgroundLight};
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: ${({ theme }) => theme.shadows.small};

  h3 {
    color: ${({ theme }) => theme.colors.primary};
    margin-bottom: 1rem;
    font-size: 1.3rem;
  }

  ul {
    list-style-type: none;
    padding: 0;

    li {
      margin-bottom: 0.8rem;
      color: ${({ theme }) => theme.colors.text};
      font-size: 1rem;
      
      &:before {
        content: "•";
        color: ${({ theme }) => theme.colors.primary};
        font-weight: bold;
        display: inline-block;
        width: 1em;
        margin-left: -1em;
      }
    }
  }
`;

const ContactInfo = styled.div`
  background: ${({ theme }) => theme.colors.backgroundLight};
  padding: 1.5rem;
  border-radius: 8px;
  margin-top: 1rem;
`;

const InfoItem = styled.p`
  margin-bottom: 0.8rem;
  color: ${({ theme }) => theme.colors.text};
  
  strong {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

export default CryptoIIITD;