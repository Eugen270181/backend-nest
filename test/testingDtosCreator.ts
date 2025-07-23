export enum LikeStatus {
  None = 'None',
  Like = 'Like',
  Dislike = 'Dislike',
}

///////////Blog///////////////родитель корень, ребенок-пост
export type BlogDto = {
  name: string;
  description: string;
  websiteUrl: string;
};
////////////Post/////////////родитель блог, ребенок-лайк, коммент
export type BlogPostDto = {
  title: string;
  shortDescription: string;
  content: string;
};
export type PostDto = BlogPostDto & { blogId: string };
///////////Comment////////////родитель пост, ребенок - лайк
export type CommentDto = {
  content: string;
};
//////////Like////////////////ЛайкиПостов, ЛайкиКоммнетов, родители соотв.,детей нет
export type LikeDto = {
  likeStatus: LikeStatus;
};
///////////User///////////////
export type UserDto = {
  login: string;
  email: string;
  password: string;
};
///////////Auth//////////////
export type LoginDto = {
  //login
  loginOrEmail: string;
  password: string;
}; //logoutDto && refreshTokenDto - send RT in cookies
export type RegistrationDto = UserDto; //registration
export type ConfirmRegDto = {
  //Registration Confirmation
  code: string;
};
export type ResendRegCodeDto = {
  //Resend Registration Code with this email
  email: string;
};
export type RecoveryPassDto = ResendRegCodeDto; //Password Recovery wich email send recCode
export type ConfirmPassDto = {
  //login
  newPassword: string;
  recoveryCode: string;
};
export type TokensDto = {
  accessToken: string;
  refreshToken: string;
};
/////////////adition function////////////////
export const createString = (length: number) => {
  let s = '';
  for (let x = 1; x <= length; x++) {
    s += x % 10;
  }
  return s;
};
export const passTestsDefault = '123456789';
/////////////////////////////////////////////
/////////////////////////////////////////////
export const testingDtosCreator = {
  createUserDto({
    login,
    email,
    password,
  }: {
    login?: string;
    email?: string;
    password?: string;
  }): UserDto {
    return {
      login: login ?? 'test_login',
      email: email ?? 'test_@gmail.com',
      password: password ?? passTestsDefault,
    };
  },
  createUserDtos(count: number): UserDto[] {
    const users: UserDto[] = [];

    for (let i = 0; i < count; i++) {
      users.push({
        login: `test${i}login`,
        email: `test${i}@gmail.com`,
        password: passTestsDefault,
      });
    }
    return users;
  },
  createBlogDto({
    name,
    description,
    websiteUrl,
  }: {
    name?: string;
    description?: string;
    websiteUrl?: string;
  }): BlogDto {
    return {
      name: name ?? 'blogTest_name',
      description: description ?? 'blogTest_description',
      websiteUrl: websiteUrl ?? 'https://test.com',
    };
  },
  createBlogDtos(count: number): BlogDto[] {
    const blogs: BlogDto[] = [];

    for (let i = 0; i < count; i++) {
      blogs.push({
        name: `blogTest${i}_name`,
        description: `blogTest${i}_description`,
        websiteUrl: `https://test${i}.com`,
      });
    }
    return blogs;
  },
  createBlogPostDto({
    title,
    shortDescription,
    content,
  }: {
    title?: string;
    shortDescription?: string;
    content?: string;
  }): BlogPostDto {
    return {
      title: title ?? 'blogPostTest_title',
      shortDescription: shortDescription ?? 'blogPostTest_shortDescription',
      content: content ?? 'blogPostTest_content',
    };
  },
  createBlogPostDtos(count: number): BlogPostDto[] {
    const posts: BlogPostDto[] = [];

    for (let i = 0; i < count; i++) {
      posts.push({
        title: `blogPostTest${i}_title`,
        shortDescription: `blogPostTest${i}_shortDescription`,
        content: `blogPostTest${i}_content`,
      });
    }
    return posts;
  },
  createPostDto({
    title,
    shortDescription,
    content,
    blogId,
  }: {
    title?: string;
    shortDescription?: string;
    content?: string;
    blogId: string;
  }): PostDto {
    return {
      title: title ?? 'postTest_title',
      shortDescription: shortDescription ?? 'postTest_shortDescription',
      content: content ?? 'postTest_content',
      blogId,
    };
  },
  createPostDtos(count: number, blogId: string): PostDto[] {
    const posts: PostDto[] = [];

    for (let i = 0; i < count; i++) {
      posts.push({
        title: `postTest${i}_title`,
        shortDescription: `postTest${i}_shortDescription`,
        content: `postTest${i}_content`,
        blogId,
      });
    }
    return posts;
  },
  createCommentDto({ content }: { content?: string }): CommentDto {
    return {
      content: content ?? 'commentTest!_content',
    };
  },
  createCommentDtos(count: number): CommentDto[] {
    const comments: CommentDto[] = [];

    for (let i = 0; i < count; i++) {
      comments.push({
        content: `commentTest${i}_content`,
      });
    }
    return comments;
  },
};
