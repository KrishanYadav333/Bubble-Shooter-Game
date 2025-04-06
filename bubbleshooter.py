import math
import pygame
import copy
import time
import sys
import os
import random
import pygame.gfxdraw
from pygame.locals import *

FPS = 120
winwdth = 940
winhgt = 740
txthgt = 20
bubblerad = 20
bubblewdth = bubblerad * 2
bubblelyrs = 5
bubadjst = 5
strx = winwdth / 2
strY = winhgt - 26
arywdth = 25
aryhgt = 20

RIGHT = 'right'
LEFT = 'left'
blank = '.'

vblue = (51, 255, 255)
black = (0, 0, 0)
white = (255, 255, 255)
grey = (100, 100, 100)
blue = (0, 0, 205)
red = (255, 0, 0)
white = (255, 255, 255)
pink = (255, 192, 203)
lightpink = (255, 182, 193)
hotpink = (255, 105, 180)
deeppink = (255, 20, 147)
cyan = (0, 255, 255)
peacockblue = (0, 164, 180)
grapecolor = (128, 49, 167)
amber = (255, 198, 0)
comic = (0, 174, 239)
lytgray = (217, 217, 214)
peach = (255, 229, 180)
green = (0, 255, 0)
GRAY = (100, 100, 100)
white = (255, 255, 255)
cyan = (0, 255, 255)
black = (0, 0, 0)

bgcolor = vblue
clrlist = [grey, blue, red, white, pink, peach, hotpink, green,
           deeppink, peacockblue, grapecolor, amber, comic, lytgray]


class Bubble(pygame.sprite.Sprite):
    def __init__(self, color, row=0, col=0):
        pygame.sprite.Sprite.__init__(self)

        self.rect = pygame.Rect(0, 0, 30, 30)
        self.rect.centerx = int(strx)
        self.rect.centery = strY
        self.speed = 10
        self.color = color
        self.radius = bubblerad
        self.angle = 0
        self.row = row
        self.col = col

    def update(self):

        if self.angle == 90:
            xmove = 0
            ymove = self.speed * -1
        elif self.angle < 90:
            xmove = self.xcalc(self.angle)
            ymove = self.ycalc(self.angle)
        elif self.angle > 90:
            xmove = self.xcalc(180 - self.angle) * -1
            ymove = self.ycalc(180 - self.angle)

        self.rect.x += int(xmove)
        self.rect.y += int(ymove)

    def draw(self):
        pygame.gfxdraw.filled_circle(
            dispsurf, self.rect.centerx, self.rect.centery, self.radius, self.color)
        pygame.gfxdraw.aacircle(
            dispsurf, self.rect.centerx, self.rect.centery, self.radius, GRAY)

    def xcalc(self, angle):
        radians = math.radians(angle)

        xmove = math.cos(radians)*(self.speed)
        return xmove

    def ycalc(self, angle):
        radians = math.radians(angle)

        ymove = math.sin(radians)*(self.speed) * -1
        return ymove


class Ary(pygame.sprite.Sprite):
    def __init__(self):
        pygame.sprite.Sprite.__init__(self)

        self.angle = 90
        arrimg = pygame.image.load('Arrow.png')
        arrimg.convert_alpha()

        arrowRect = arrimg.get_rect()
        self.image = arrimg
        self.transformImage = self.image
        self.rect = arrowRect
        self.rect.centerx = int(strx)
        self.rect.centery = strY

    def update(self, dir):

        if (dir == LEFT and self.angle < 180):
            self.angle += 2
        elif (dir == RIGHT and self.angle > 0):
            self.angle -= 2

        self.transformImage = pygame.transform.rotate(self.image, self.angle)
        self.rect = self.transformImage.get_rect()
        self.rect.centerx = int(strx)
        self.rect.centery = strY

    def draw(self):
        dispsurf.blit(self.transformImage, self.rect)


class Score(object):
    def __init__(self):
        self.total = 0
        self.font = pygame.font.SysFont('merlin', 35)
        self.render = self.font.render(
            'Score: ' + str(self.total), True, black, white)
        self.rect = self.render.get_rect()
        self.rect.left = 5
        self.rect.bottom = winhgt - 5

    def update(self, dellst):
        self.total += ((len(dellst)) * 10)
        self.render = self.font.render(
            'Score: ' + str(self.total), True, black, white)

    def draw(self):
        dispsurf.blit(self.render, self.rect)


def main():

    global fpsclock, dispsurf, disprect, mainfont
    pygame.init()

    fpsclock = pygame.time.Clock()
    pygame.display.set_caption('Bubble Shooter')
    mainfont = pygame.font.SysFont('Comic Sans MS', txthgt)
    dispsurf, disprect = makeDisplay()

    while True:
        score, winorlose = rngame()
        endScreen(score, winorlose)

