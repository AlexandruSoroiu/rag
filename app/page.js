'use client'
import { IconButton, Tooltip, Slide, Typography, Divider, Rating, Button, Box, Stack, TextField, Grid } from '@mui/material'
import Image from 'next/image'
import React, { useState } from 'react'
import { Send, Star, Link as LinkIcon, ArrowDownward } from '@mui/icons-material'
import BackgroundImage from './backgroundImage.jpg'

export default function Home() {

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I'm the Rate My Professor support assistant. How can I help you today?"
    }
  ])
  const [professorLink, setProfessorLink] = useState('')
  const [professorName, setProfessorName] = useState('')
  const [rating, setRating] = useState(0)
  const [message, setMessage] = useState('')
  const [review, setReview] = useState('')
  const [subject, setSubject] = useState('')
  const [school, setSchool] = useState('')

  const handleSubmitLink = () => {
    // Add logic to submit professor link to the database
    console.log('Professor Link Submitted:', professorLink);
    let msgs = [professorLink]
    fetch('/api/chat', {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([...msgs, { role: "user", content: professorLink, link: professorLink }])
    })
  }

  const handleSubmitDetails = () => {
    // Add logic to submit professor details to the database
    console.log('Professor Details Submitted:', { professorName, school, rating, subject, review });
    let msgs = []
    fetch('/api/chat', {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([...msgs, {
        role: "user", professorName: professorName, school: school,
        rating: rating, subject: subject, review: review
      }])
    })
  }

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      sendMessage()
    }
  };


  const sendMessage = async () => {
    setMessages((messages) => [
      ...messages,
      { role: "user", content: message },
      { role: "assistant", content: '' }
    ])

    setMessage('')
    const response = fetch('/api/chat', {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([...messages, { role: "user", content: message }])
    }).then(async (res) => {
      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      let result = ''
      return reader.read().then(function processText({ done, value }) {
        if (done) {
          return result
        }
        const text = decoder.decode(value || new Uint8Array(), { stream: true })
        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1]
          let otherMessages = messages.slice(0, messages.length - 1)
          return [
            ...otherMessages,
            { ...lastMessage, content: lastMessage.content + text },
          ]
        })

        return reader.read().then(processText)
      })
    })
  }

  return (
    <>
      <Box
        sx={{
          width: '100%',
          height: '100vh',
          backgroundImage: `url(${BackgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          textAlign: 'center',
          padding: '20px',
          color: '#fff',
        }}
      >
        <Slide direction="down" in={true} timeout={800}>
          <Typography
            sx={{
              mt: 2,
              bgcolor: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              padding: '10px 20px',
              borderRadius: 4,
              boxShadow: 3,
              display: 'inline-flex',
              alignItems: 'center',
              fontFamily: 'Roboto, sans-serif',
            }}
            variant="h2"
          >
            <Star sx={{ mr: 2, color: 'gold' }} />
            Welcome to AI Rate My Professor Agent!
          </Typography>
        </Slide>

        <Button
          variant="contained"
          color="secondary"
          sx={{ mt: 3, bgcolor: 'rgba(0, 0, 0, 0.8)', padding: '10px 20px', borderRadius: 4, fontWeight: 'bold', textTransform: 'none', display: 'flex', alignItems: 'center', '&:hover': { bgcolor: 'rgba(50, 50, 50, 0.9)' } }}
          onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
        >
          Get Started
          <ArrowDownward sx={{ ml: 1 }} />
        </Button>
      </Box>

      <Grid container justifyContent="center" alignItems="center" style={{ minHeight: '100vh', padding: '20px', backgroundColor: '#f0f0f0' }}>
        <Grid item xs={12} sm={6} md={4}>
          <Box
            width="100%"
            height="100%"
            p={3}
            borderRadius={4}
            bgcolor="#fafafa"
            boxShadow={5}
          >
            <Typography variant="h5" gutterBottom>
              Add Professor Details
            </Typography>

            <Divider sx={{ mb: 3 }} />

            <Stack spacing={2}>
              <TextField
                label="Link from ratemyprofessors.com"
                fullWidth
                value={professorLink}
                onChange={(e) => setProfessorLink(e.target.value)}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <LinkIcon sx={{ mr: 1, color: 'action.active' }} />
                  ),
                }}
              />
              <Button
                variant="contained"
                color="primary"
                sx={{ textTransform: 'none', fontWeight: 'bold' }}
                onClick={handleSubmitLink}
              >
                Add Link
              </Button>

              <TextField
                label="Professor Name"
                fullWidth
                value={professorName}
                onChange={(e) => setProfessorName(e.target.value)}
                variant="outlined"
              />
              <TextField
                label="School"
                fullWidth
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                variant="outlined"
              />
              <TextField
                label="Subject"
                fullWidth
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                variant="outlined"
              />
              <Box>
                <Typography component="legend">Rating</Typography>
                <Rating
                  name="professor-rating"
                  value={rating}
                  onChange={(event, newValue) => setRating(newValue)}
                  precision={0.5}
                />
              </Box>
              <TextField
                label="Write a Review"
                fullWidth
                value={review}
                onChange={(e) => setReview(e.target.value)}
                variant="outlined"
                multiline
                rows={4}
              />

              <Button
                variant="contained"
                color="primary"
                sx={{ textTransform: 'none', fontWeight: 'bold' }}
                onClick={handleSubmitDetails}
              >
                Submit Details
              </Button>
            </Stack>
          </Box>
        </Grid>

        <Grid item xs={12} sm={6} md={8}>
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100%"
            bgcolor="#ffffff"
            borderRadius={4}
            boxShadow={5}
            p={3}
          >
            <Stack
              direction="column"
              width="100%"
              height="100%"
              spacing={3}
            >
              <Stack direction="column" spacing={2} flexGrow={1} overflow="auto" maxHeight="100%">
                {messages.map((message, index) => (
                  <Box
                    key={index}
                    display="flex"
                    justifyContent={message.role === "assistant" ? "flex-start" : "flex-end"}
                  >
                    <Box
                      bgcolor={message.role === "assistant" ? "primary.main" : "secondary.main"}
                      color="white"
                      borderRadius={16}
                      p={2}
                      sx={{ animation: 'fadeIn 0.5s ease-in-out' }}
                    >
                      {message.content}
                    </Box>
                  </Box>
                ))}
              </Stack>

              <Stack direction="row" spacing={2}>
                <TextField
                  label="Message"
                  fullWidth
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  variant="outlined"
                  onKeyDown={handleKeyPress}
                />
                <Tooltip title="Send Message">
                  <IconButton color="primary" onClick={sendMessage}>
                    <Send />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>
          </Box>
        </Grid>
      </Grid>
    </>
  );
}
